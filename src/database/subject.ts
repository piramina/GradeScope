
import * as SQLite from 'expo-sqlite';
import { initDatabase } from './semester';

export type Subject = {
  id: number;
  semester_id: number;
  code: string;
  name: string;
  credits: number;
  type: 'Theory' | 'Practical';
  semester_name: string;
};

export type SubjectInput = {
  semester_id: number;
  code: string;
  name: string;
  credits: number;
  type: 'Theory' | 'Practical';
};

const database = SQLite.openDatabaseAsync('gradescope.db');

async function getDB() {
  await initDatabase();

  const db = await database;

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      semester_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      credits REAL NOT NULL CHECK (credits > 0),
      type TEXT NOT NULL CHECK (
        type IN ('Theory', 'Practical')
      ),
      FOREIGN KEY (semester_id)
        REFERENCES semesters(id)
        ON DELETE RESTRICT,
      UNIQUE (semester_id, code)
    );

    CREATE INDEX IF NOT EXISTS
      idx_subjects_semester
      ON subjects(semester_id);
  `);

  return db;
}

export async function getSubjects(): Promise<Subject[]> {
  const db = await getDB();

  return db.getAllAsync<Subject>(`
    SELECT
      s.*,
      sem.name AS semester_name
    FROM subjects s
    JOIN semesters sem ON sem.id = s.semester_id
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
      data.code.trim(),
      data.name.trim(),
      data.credits,
      data.type,
    ]
  );
}

export async function updateSubject(
  id: number,
  data: SubjectInput
) {
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
      data.code.trim(),
      data.name.trim(),
      data.credits,
      data.type,
      id,
    ]
  );
}

export async function deleteSubject(id: number) {
  const db = await getDB();

  return db.runAsync(
    'DELETE FROM subjects WHERE id = ?',
    [id]
  );
}
