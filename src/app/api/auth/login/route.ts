import { NextResponse } from "next/server";
import { createSession, normalizeLogin, verifyPassword } from "@/server/auth";
import { sqlite } from "@/server/sqlite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let payload: unknown;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 }); }

  const { login, password } = (payload ?? {}) as { login?: unknown; password?: unknown };
  if (typeof login !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  const user = sqlite.prepare("SELECT id, password_hash FROM users WHERE login = ?").get(normalizeLogin(login)) as { id: number; password_hash: string } | undefined;
  if (!user) return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
