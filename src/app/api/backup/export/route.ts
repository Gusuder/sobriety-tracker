import { NextResponse } from "next/server";
import { authError, getAuthedUserId } from "@/server/auth";
import { sqlite } from "@/server/sqlite";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getAuthedUserId();
  if (!userId) return authError();

  const dayRows = sqlite.prepare("SELECT payload FROM day_entries WHERE user_id = ?").all(userId) as { payload: string }[];
  const crisisRows = sqlite.prepare("SELECT payload FROM crisis_sessions WHERE user_id = ?").all(userId) as { payload: string }[];

  return NextResponse.json({
    version: 1,
    exportedAt: Date.now(),
    dayEntries: dayRows.map((r) => JSON.parse(r.payload)),
    crisisSessions: crisisRows.map((r) => JSON.parse(r.payload)),
  });
}
