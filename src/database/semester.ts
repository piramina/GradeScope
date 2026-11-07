import * as SQLite from "expo-sqlite";

export type Semester = {
  id: number;
  name: string;
  academic_year: string;
  created_at: string;
};

const database = SQLite.openDatabaseAsync("gradescope.db");

export async function initDatabase() {
  const db = await database;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS semesters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function getSemesters(): Promise<Semester[]> {
  const db = await database;

  return db.getAllAsync<Semester>("SELECT * FROM semesters ORDER BY id DESC");
}

export async function addSemester(name: string, academicYear: string) {
  const db = await database;

  return db.runAsync(
    "INSERT INTO semesters (name, academic_year) VALUES (?, ?)",
    name.trim(),
    academicYear.trim(),
  );
}

export async function updateSemester(
  id: number,
  name: string,
  academicYear: string,
) {
  const db = await database;

  return db.runAsync(
    `UPDATE semesters
     SET name = ?, academic_year = ?
     WHERE id = ?`,
    name.trim(),
    academicYear.trim(),
    id,
  );
}

export async function deleteSemester(id: number) {
  const db = await database;

  return db.runAsync("DELETE FROM semesters WHERE id = ?", id);
}
