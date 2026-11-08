import * as SQLite from "expo-sqlite";
import { initDatabase } from "./semester";

export type Subject = {
  id: number;
  semester_id: number;
  code: string;
  name: string;
  credits: number;
  type: "Theory" | "Practical";
  semester_name: string;
};

export type SubjectInput = {
  semester_id: number;
  code: string;
  name: string;
  credits: number;
  type: "Theory" | "Practical";
};

const database = SQLite.openDatabaseAsync("gradescope.db");

let initialization: Promise<void> | null = null;

async function initializeSubjects() {
  await initDatabase();

  const db = await database;

  const existing = await db.getFirstAsync<{
    sql: string | null;
  }>(
    `SELECT sql
     FROM sqlite_master
     WHERE type = 'table' AND name = 'subjects'`,
  );

  // Detect the previous UNIQUE(semester_id, code) rule.
  const needsMigration =
    existing?.sql != null &&
    /UNIQUE\s*\(\s*semester_id\s*,\s*code\s*\)/i.test(existing.sql);

  if (needsMigration) {
    // Keep existing subject IDs so ICA records remain linked.
    await db.execAsync("PRAGMA foreign_keys = OFF;");

    try {
      await db.execAsync(`
        BEGIN IMMEDIATE;

        CREATE TABLE subjects_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          semester_id INTEGER NOT NULL,
          code TEXT NOT NULL COLLATE NOCASE,
          name TEXT NOT NULL,
          credits REAL NOT NULL CHECK (credits > 0),
          type TEXT NOT NULL CHECK (
            type IN ('Theory', 'Practical')
          ),
          FOREIGN KEY (semester_id)
            REFERENCES semesters(id)
            ON DELETE RESTRICT,
          UNIQUE (semester_id, code, type)
        );

        INSERT INTO subjects_new
          (id, semester_id, code, name, credits, type)
        SELECT
          id, semester_id, code, name, credits, type
        FROM subjects;

        DROP TABLE subjects;

        ALTER TABLE subjects_new RENAME TO subjects;

        COMMIT;
      `);
    } catch (error) {
      try {
        await db.execAsync("ROLLBACK;");
      } catch {
        // Transaction may already have rolled back.
      }

      throw error;
    } finally {
      await db.execAsync("PRAGMA foreign_keys = ON;");
    }
  }

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      semester_id INTEGER NOT NULL,
      code TEXT NOT NULL COLLATE NOCASE,
      name TEXT NOT NULL,
      credits REAL NOT NULL CHECK (credits > 0),
      type TEXT NOT NULL CHECK (
        type IN ('Theory', 'Practical')
      ),
      FOREIGN KEY (semester_id)
        REFERENCES semesters(id)
        ON DELETE RESTRICT,
      UNIQUE (semester_id, code, type)
    );

    CREATE INDEX IF NOT EXISTS idx_subjects_semester
      ON subjects(semester_id);
  `);

  const foreignKeyErrors = await db.getAllAsync("PRAGMA foreign_key_check;");

  if (foreignKeyErrors.length > 0) {
    throw new Error("Database foreign key validation failed.");
  }
}

async function getDB() {
  if (!initialization) {
    initialization = initializeSubjects().catch((error) => {
      initialization = null;
      throw error;
    });
  }

  await initialization;
  return database;
}

export async function getSubjects(): Promise<Subject[]> {
  const db = await getDB();

  return db.getAllAsync<Subject>(`
    SELECT
      s.*,
      sem.name AS semester_name
    FROM subjects s
    JOIN semesters sem
      ON sem.id = s.semester_id
    ORDER BY s.id DESC
  `);
}

export async function addSubject(data: SubjectInput) {
  const db = await getDB();

  return db.runAsync(
    `INSERT INTO subjects
      (semester_id, code, name, credits, type)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.semester_id,
      data.code.trim().toUpperCase(),
      data.name.trim(),
      data.credits,
      data.type,
    ],
  );
}

export async function updateSubject(id: number, data: SubjectInput) {
  const db = await getDB();

  return db.runAsync(
    `UPDATE subjects
     SET semester_id = ?,
         code = ?,
         name = ?,
         credits = ?,
         type = ?
     WHERE id = ?`,
    [
      data.semester_id,
      data.code.trim().toUpperCase(),
      data.name.trim(),
      data.credits,
      data.type,
      id,
    ],
  );
}

export async function deleteSubject(id: number) {
  const db = await getDB();

  return db.runAsync("DELETE FROM subjects WHERE id = ?", [id]);
}
