import * as SQLite from "expo-sqlite";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getSharedDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync("gradescope.db").catch(
      (error) => {
        databasePromise = null;
        throw error;
      },
    );
  }

  return databasePromise;
}
