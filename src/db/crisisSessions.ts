import type { CrisisSession } from "@/domain/types";
import { getDb } from "./client";

export async function addCrisisSession(s: CrisisSession): Promise<void> {
  const db = await getDb();
  await db.put("crisis_sessions", s);
}

export async function listCrisisSessions(): Promise<CrisisSession[]> {
  const db = await getDb();
  return db.getAll("crisis_sessions");
}