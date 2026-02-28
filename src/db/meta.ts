import { apiJson } from "./http";

export async function metaSet(key: string, value: unknown): Promise<void> {
  await apiJson<{ ok: true }>(`/api/meta/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
}

export async function metaGet<T = unknown>(key: string): Promise<T | undefined> {
  const data = await apiJson<{ value?: T }>(`/api/meta/${encodeURIComponent(key)}`, { cache: "no-store" });
  return data.value as T | undefined;
}
