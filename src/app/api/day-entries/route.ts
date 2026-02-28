import { NextResponse } from "next/server";
import { authError, getAuthedUserId } from "@/server/auth";
import { sqlite } from "@/server/sqlite";
import type { DayEntry } from "@/domain/types";

export const runtime = "nodejs";

function isDayEntry(entry: unknown): entry is DayEntry {
  if (!entry || typeof entry !== "object") return false;
  const v = entry as Record<string, unknown>;
  return (
    typeof v.dateKey === "string" &&
    typeof v.isSober === "boolean" &&
    Array.isArray(v.triggers) &&
    typeof v.note === "string" &&
    typeof v.createdAt === "number" &&
    typeof v.updatedAt === "number"
  );
}

export async function GET(req: Request) {
  const userId = await getAuthedUserId();
  if (!userId) return authError();

  const { searchParams } = new URL(req.url);
  const dateKey = searchParams.get("dateKey");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (dateKey) {
    const row = sqlite.prepare("SELECT payload FROM day_entries WHERE user_id = ? AND date_key = ?").get(userId, dateKey) as { payload: string } | undefined;
    return NextResponse.json({ item: row ? JSON.parse(row.payload) : null });
  }

  if (from && to) {
    const rows = sqlite
      .prepare("SELECT payload FROM day_entries WHERE user_id = ? AND date_key >= ? AND date_key <= ? ORDER BY date_key")
      .all(userId, from, to) as { payload: string }[];
    return NextResponse.json({ items: rows.map((r) => JSON.parse(r.payload)) });
  }

  const rows = sqlite.prepare("SELECT payload FROM day_entries WHERE user_id = ? ORDER BY date_key").all(userId) as { payload: string }[];
  return NextResponse.json({ items: rows.map((r) => JSON.parse(r.payload)) });
}

export async function POST(req: Request) {
  const userId = await getAuthedUserId();
  if (!userId) return authError();

  let payload: unknown;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 }); }

  if (!isDayEntry(payload)) return NextResponse.json({ error: "Некорректная запись дня" }, { status: 400 });

  sqlite
    .prepare("INSERT INTO day_entries(user_id, date_key, payload, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, date_key) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at")
    .run(userId, payload.dateKey, JSON.stringify(payload), payload.updatedAt);

  return NextResponse.json({ ok: true });
}
