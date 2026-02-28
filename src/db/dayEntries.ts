import type { DayEntry } from "@/domain/types";
import { apiJson } from "./http";

export async function getDayEntry(dateKey: string): Promise<DayEntry | undefined> {
  const data = await apiJson<{ item: DayEntry | null }>(`/api/day-entries?dateKey=${encodeURIComponent(dateKey)}`, { cache: "no-store" });
  return data.item ?? undefined;
}

export async function upsertDayEntry(entry: DayEntry): Promise<void> {
  await apiJson<{ ok: true }>("/api/day-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}

export async function listDayEntries(): Promise<DayEntry[]> {
  const data = await apiJson<{ items: DayEntry[] }>("/api/day-entries", { cache: "no-store" });
  return data.items ?? [];
}

export async function listDayEntriesRange(fromKey: string, toKey: string): Promise<DayEntry[]> {
  const data = await apiJson<{ items: DayEntry[] }>(`/api/day-entries?from=${encodeURIComponent(fromKey)}&to=${encodeURIComponent(toKey)}`, { cache: "no-store" });
  return data.items ?? [];
}
