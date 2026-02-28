import { NextResponse } from "next/server";
import { authError, getAuthedUserId } from "@/server/auth";
import { sqlite } from "@/server/sqlite";
import type { CrisisSession } from "@/domain/types";

export const runtime = "nodejs";

function isCrisisSession(session: unknown): session is CrisisSession {
  if (!session || typeof session !== "object") return false;
  const v = session as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.startAt === "number" &&
    typeof v.endAt === "number" &&
    typeof v.durationSec === "number" &&
    typeof v.usedBreathing === "boolean" &&
    typeof v.usedSupportText === "boolean" &&
    typeof v.usedGame === "boolean" &&
    (v.result === "better" || v.result === "same")
  );
}

export async function GET() {
  const userId = await getAuthedUserId();
  if (!userId) return authError();

  const rows = sqlite.prepare("SELECT payload FROM crisis_sessions WHERE user_id = ? ORDER BY start_at DESC").all(userId) as { payload: string }[];
  return NextResponse.json({ items: rows.map((r) => JSON.parse(r.payload)) });
}

export async function POST(req: Request) {
  const userId = await getAuthedUserId();
  if (!userId) return authError();

  let payload: unknown;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 }); }

  if (!isCrisisSession(payload)) return NextResponse.json({ error: "Некорректная кризисная сессия" }, { status: 400 });

  sqlite
    .prepare("INSERT INTO crisis_sessions(user_id, id, payload, start_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, id) DO UPDATE SET payload=excluded.payload, start_at=excluded.start_at")
    .run(userId, payload.id, JSON.stringify(payload), payload.startAt);

  return NextResponse.json({ ok: true });
}
