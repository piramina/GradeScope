import * as SQLite from "expo-sqlite";
import { getSubjects } from "./subject";
import { getSharedDatabase } from "./db";


export type ICARecord = {
  id: number;
  subject_id: number;
  ica1: number;
  ica2: number;
  ica3: number;
  subject_name: string;
  subject_code: string;
  type: "Theory" | "Practical";
};

const database = getSharedDatabase();

async function getDB() {
  await getSubjects();

  const db = await database;

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS ica_marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL UNIQUE,
      ica1 REAL NOT NULL CHECK (ica1 BETWEEN 0 AND 100),
      ica2 REAL NOT NULL CHECK (ica2 BETWEEN 0 AND 100),
      ica3 REAL NOT NULL CHECK (ica3 BETWEEN 0 AND 100),
      FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
    );
  `);

  return db;
}

export function calculateICA(marks: number[], type: "Theory" | "Practical") {
  if (
    marks.length !== 3 ||
    marks.some((mark) => !Number.isFinite(mark) || mark < 0 || mark > 100)
  ) {
    throw new Error("Enter three ICA marks between 0 and 100.");
  }

  const bestTwo = [...marks].sort((a, b) => b - a).slice(0, 2);
  const average = (bestTwo[0] + bestTwo[1]) / 2;
  const weight = type === "Theory" ? 30 : 40;
  const contribution = (average * weight) / 100;

  return {
    bestTwo,
    average,
    weight,
    contribution,
  };
}

export async function getICARecords(): Promise<ICARecord[]> {
  const db = await getDB();

  return db.getAllAsync<ICARecord>(`
    SELECT
      i.*,
      s.name AS subject_name,
      s.code AS subject_code,
      s.type
    FROM ica_marks i
    JOIN subjects s ON s.id = i.subject_id
    ORDER BY i.id DESC
  `);
}

export async function saveICA(subjectId: number, marks: number[]) {
  calculateICA(marks, "Theory");

  const db = await getDB();

  await db.runAsync(
    `INSERT INTO ica_marks (subject_id, ica1, ica2, ica3)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(subject_id)
     DO UPDATE SET
       ica1 = excluded.ica1,
       ica2 = excluded.ica2,
       ica3 = excluded.ica3`,
    [subjectId, marks[0], marks[1], marks[2]],
  );
}

export async function deleteICA(subjectId: number) {
  const db = await getDB();

  await db.runAsync("DELETE FROM ica_marks WHERE subject_id = ?", [subjectId]);
}
