import { getDb } from "./client";
import type { DayEntry, CrisisSession } from "@/domain/types";

export type BackupV1 = {
  version: 1;
  exportedAt: number;
  dayEntries: DayEntry[];
  crisisSessions: CrisisSession[];
};

export type ImportMode = "merge" | "replace";

export async function exportBackup(): Promise<BackupV1> {
  const db = await getDb();
  const tx = db.transaction(["day_entries", "crisis_sessions"], "readonly");
  const dayEntries = await tx.objectStore("day_entries").getAll();
  const crisisSessions = await tx.objectStore("crisis_sessions").getAll();
  await tx.done;

  return {
    version: 1,
    exportedAt: Date.now(),
    dayEntries,
    crisisSessions,
  };
}

export async function importBackupAtomic(data: BackupV1, mode: ImportMode): Promise<void> {
  const db = await getDb();

  // Одна транзакция на оба store -> атомарность
  const tx = db.transaction(["day_entries", "crisis_sessions"], "readwrite");
  const dayStore = tx.objectStore("day_entries");
  const crisisStore = tx.objectStore("crisis_sessions");

  if (mode === "replace") {
    await dayStore.clear();
    await crisisStore.clear();
  }

  for (const e of data.dayEntries) {
    await dayStore.put(e); // upsert по dateKey
  }
  for (const s of data.crisisSessions) {
    await crisisStore.put(s); // upsert по id
  }

  // Если где-то ошибка — tx упадёт и ничего не применится
  await tx.done;
}