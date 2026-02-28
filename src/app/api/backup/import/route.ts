import { NextResponse } from "next/server";
import { authError, getAuthedUserId } from "@/server/auth";
import { sqlite } from "@/server/sqlite";
import { parseExportBlob } from "@/domain/exportSchema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await getAuthedUserId();
  if (!userId) return authError();

  let payload: unknown;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 }); }

  const { data, mode } = (payload ?? {}) as { data?: unknown; mode?: unknown };
  if (mode !== "merge" && mode !== "replace") return NextResponse.json({ error: "Некорректный режим импорта" }, { status: 400 });

  const parsed = parseExportBlob(data);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const tx = sqlite.transaction(() => {
    if (mode === "replace") {
      sqlite.prepare("DELETE FROM day_entries WHERE user_id = ?").run(userId);
      sqlite.prepare("DELETE FROM crisis_sessions WHERE user_id = ?").run(userId);
    }

    for (const e of parsed.value.dayEntries) {
      sqlite
        .prepare("INSERT INTO day_entries(user_id, date_key, payload, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, date_key) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at")
        .run(userId, e.dateKey, JSON.stringify(e), e.updatedAt);
    }

    for (const s of parsed.value.crisisSessions) {
      sqlite
        .prepare("INSERT INTO crisis_sessions(user_id, id, payload, start_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, id) DO UPDATE SET payload=excluded.payload, start_at=excluded.start_at")
        .run(userId, s.id, JSON.stringify(s), s.startAt);
    }
  });

  tx();
  return NextResponse.json({ ok: true });
}
