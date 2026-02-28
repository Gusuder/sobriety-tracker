import type { CrisisSession } from "@/domain/types";
import { apiJson } from "./http";

export async function addCrisisSession(s: CrisisSession): Promise<void> {
  await apiJson<{ ok: true }>("/api/crisis-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(s),
  });
}

export async function listCrisisSessions(): Promise<CrisisSession[]> {
  const data = await apiJson<{ items: CrisisSession[] }>("/api/crisis-sessions", { cache: "no-store" });
  return data.items ?? [];
}
