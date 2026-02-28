import { NextResponse } from "next/server";
import { getAuthedUserId } from "@/server/auth";
import { sqlite } from "@/server/sqlite";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getAuthedUserId();
  if (!userId) return NextResponse.json({ user: null });
  const row = sqlite.prepare("SELECT login FROM users WHERE id = ?").get(userId) as { login: string } | undefined;
  return NextResponse.json({ user: row ? { login: row.login } : null });
}
