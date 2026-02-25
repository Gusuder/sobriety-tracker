import { getDb } from "./client";

export async function metaSet(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put("app_meta", { key, value, updatedAt: Date.now() });
}

export async function metaGet<T = unknown>(key: string): Promise<T | undefined> {
  const db = await getDb();
  const row = await db.get("app_meta", key);
  return (row?.value as T | undefined) ?? undefined;
}