import type { DayEntry } from "@/domain/types";
import { getDb } from "./client";

export async function getDayEntry(dateKey: string): Promise<DayEntry | undefined> {
  const db = await getDb();
  return db.get("day_entries", dateKey);
}

export async function upsertDayEntry(entry: DayEntry): Promise<void> {
  const db = await getDb();
  await db.put("day_entries", entry);
}

export async function listDayEntries(): Promise<DayEntry[]> {
  const db = await getDb();
  return db.getAll("day_entries");
}

export async function listDayEntriesRange(fromKey: string, toKey: string): Promise<DayEntry[]> {
  const db = await getDb();
  const range = IDBKeyRange.bound(fromKey, toKey);
  return db.getAll("day_entries", range);
}