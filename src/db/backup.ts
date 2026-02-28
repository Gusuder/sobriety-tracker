import type { DayEntry, CrisisSession } from "@/domain/types";
import { apiJson } from "./http";

export type BackupV1 = {
  version: 1;
  exportedAt: number;
  dayEntries: DayEntry[];
  crisisSessions: CrisisSession[];
};

export type ImportMode = "merge" | "replace";

export async function exportBackup(): Promise<BackupV1> {
  return apiJson<BackupV1>("/api/backup/export", { cache: "no-store" });
}

export async function importBackupAtomic(data: BackupV1, mode: ImportMode): Promise<void> {
  await apiJson<{ ok: true }>("/api/backup/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, mode }),
  });
}
