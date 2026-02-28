import { NextResponse } from "next/server";
import { authError, getAuthedUserId } from "@/server/auth";
import { sqlite } from "@/server/sqlite";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const userId = await getAuthedUserId();
  if (!userId) return authError();

  const { key } = await params;
  const row = sqlite.prepare("SELECT value FROM app_meta WHERE user_id = ? AND key = ?").get(userId, key) as { value: string } | undefined;
  return NextResponse.json({ value: row ? JSON.parse(row.value) : undefined });
}

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const userId = await getAuthedUserId();
  if (!userId) return authError();

  const { key } = await params;
  let payload: unknown;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 }); }

  const { value } = (payload ?? {}) as { value?: unknown };
  sqlite
    .prepare("INSERT INTO app_meta(user_id, key, value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at")
    .run(userId, key, JSON.stringify(value ?? null), Date.now());

  return NextResponse.json({ ok: true });
}
