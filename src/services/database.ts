import * as SQLite from "expo-sqlite";
import type { WeightEntry } from "../features/weight/model";
let connection: Promise<SQLite.SQLiteDatabase> | undefined;
async function initialize() {
  const db = await SQLite.openDatabaseAsync("bodylog.db");
  await db.execAsync(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS weights (
      id TEXT PRIMARY KEY NOT NULL, date TEXT UNIQUE NOT NULL,
      weightKg REAL NOT NULL CHECK(weightKg >= 20 AND weightKg <= 350), createdAt INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    PRAGMA user_version = 1;`);
  return db;
}
function database() {
  return (connection ??= initialize().catch((error) => {
    connection = undefined;
    throw error;
  }));
}
export async function listWeights(): Promise<WeightEntry[]> {
  return (await database()).getAllAsync<WeightEntry>(
    "SELECT * FROM weights ORDER BY date ASC",
  );
}
export async function saveWeight(
  date: string,
  weightKg: number,
): Promise<void> {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(weightKg) ||
    weightKg < 20 ||
    weightKg > 350
  )
    throw new Error("Invalid weight");
  await (
    await database()
  ).runAsync(
    "INSERT INTO weights(id, date, weightKg, createdAt) VALUES(?, ?, ?, ?) ON CONFLICT(date) DO UPDATE SET weightKg = excluded.weightKg",
    `${date}-${Date.now()}`,
    date,
    weightKg,
    Date.now(),
  );
}
export async function deleteWeight(date: string): Promise<void> {
  await (await database()).runAsync("DELETE FROM weights WHERE date = ?", date);
}
export async function getSetting(key: string): Promise<string | null> {
  return (
    (
      await (
        await database()
      ).getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = ?",
        key,
      )
    )?.value ?? null
  );
}
export async function setSetting(key: string, value: string): Promise<void> {
  await (
    await database()
  ).runAsync(
    "INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}
