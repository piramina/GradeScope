import * as SQLite from "expo-sqlite";
import { getSubjects } from "./subject";

export const GRADE_POINTS = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  E: 0.0,
} as const;

export type Grade = keyof typeof GRADE_POINTS;

export const GRADES = Object.keys(GRADE_POINTS) as Grade[];

export type GPARecord = {
  id: number;
  semester_id: number;
  course_code: string;
  credits: number;
  grade: Grade | null;
  grade_point: number;
};

export type GPASummary = {
  gpa: number | null;
  credits: number;
  courses: number;
};

const database = SQLite.openDatabaseAsync("gradescope.db");

let initialized: Promise<void> | null = null;

export function getGradePoint(grade: Grade): number {
  return GRADE_POINTS[grade];
}

async function initializeGPA(): Promise<void> {
  await getSubjects();

  const db = await database;

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS gpa_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      semester_id INTEGER NOT NULL,
      course_code TEXT NOT NULL COLLATE NOCASE,
      credits REAL NOT NULL CHECK (credits > 0),
      grade TEXT,
      grade_point REAL NOT NULL
        CHECK (grade_point >= 0 AND grade_point <= 4),
      FOREIGN KEY (semester_id)
        REFERENCES semesters(id)
        ON DELETE RESTRICT,
      UNIQUE (semester_id, course_code)
    );
  `);

  const columns = await db.getAllAsync<{
    name: string;
  }>("PRAGMA table_info(gpa_results)");

  if (!columns.some((column) => column.name === "grade")) {
    await db.execAsync(`
      ALTER TABLE gpa_results
      ADD COLUMN grade TEXT;
    `);
  }
}

async function getDB() {
  if (!initialized) {
    initialized = initializeGPA().catch((error) => {
      initialized = null;
      throw error;
    });
  }

  await initialized;
  return database;
}

export async function getGPARecords(): Promise<GPARecord[]> {
  const db = await getDB();

  await db.runAsync(`
    DELETE FROM gpa_results
    WHERE NOT EXISTS (
      SELECT 1
      FROM subjects
      WHERE subjects.semester_id = gpa_results.semester_id
        AND UPPER(TRIM(subjects.code)) =
            UPPER(TRIM(gpa_results.course_code))
    )
  `);

  return db.getAllAsync<GPARecord>(`
    SELECT
      id,
      semester_id,
      course_code,
      credits,
      grade,
      grade_point
    FROM gpa_results
    ORDER BY semester_id, course_code
  `);
}

export async function saveGPARecord(
  semesterId: number,
  courseCode: string,
  credits: number,
  grade: Grade,
) {
  const code = courseCode.trim().toUpperCase();

  if (
    !Number.isInteger(semesterId) ||
    semesterId <= 0 ||
    !code ||
    !Number.isFinite(credits) ||
    credits <= 0 ||
    !Object.prototype.hasOwnProperty.call(GRADE_POINTS, grade)
  ) {
    throw new Error("Invalid GPA result details.");
  }

  const gradePoint = getGradePoint(grade);

  const db = await getDB();

  return db.runAsync(
    `INSERT INTO gpa_results
      (semester_id, course_code, credits, grade, grade_point)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(semester_id, course_code)
     DO UPDATE SET
       credits = excluded.credits,
       grade = excluded.grade,
       grade_point = excluded.grade_point`,
    [semesterId, code, credits, grade, gradePoint],
  );
}

export async function deleteGPARecord(id: number) {
  const db = await getDB();

  return db.runAsync("DELETE FROM gpa_results WHERE id = ?", [id]);
}

export function calculateGPA(
  records: Pick<GPARecord, "credits" | "grade_point">[],
): GPASummary {
  const valid = records.filter(
    (record) =>
      Number.isFinite(record.credits) &&
      record.credits > 0 &&
      Number.isFinite(record.grade_point) &&
      record.grade_point >= 0 &&
      record.grade_point <= 4,
  );

  const credits = valid.reduce((sum, record) => sum + record.credits, 0);

  if (credits === 0) {
    return {
      gpa: null,
      credits: 0,
      courses: 0,
    };
  }

  const weightedTotal = valid.reduce(
    (sum, record) => sum + record.credits * record.grade_point,
    0,
  );

  return {
    gpa: weightedTotal / credits,
    credits,
    courses: valid.length,
  };
}
