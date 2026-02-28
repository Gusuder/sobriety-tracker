import { NextResponse } from "next/server";
import { createSession, hashPassword, normalizeLogin } from "@/server/auth";
import { sqlite } from "@/server/sqlite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let payload: unknown;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 }); }

  const { login, password } = (payload ?? {}) as { login?: unknown; password?: unknown };
  if (typeof login !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Некорректный логин или пароль" }, { status: 400 });
  }

  const normalizedLogin = normalizeLogin(login);
  if (normalizedLogin.length < 3 || password.length < 6) {
    return NextResponse.json({ error: "Некорректный логин или пароль" }, { status: 400 });
  }

  const existing = sqlite.prepare("SELECT id FROM users WHERE login = ?").get(normalizedLogin) as { id: number } | undefined;
  if (existing) return NextResponse.json({ error: "Логин уже занят" }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const result = sqlite.prepare("INSERT INTO users(login, password_hash, created_at) VALUES (?, ?, ?)").run(normalizedLogin, passwordHash, Date.now());

  await createSession(Number(result.lastInsertRowid));
  return NextResponse.json({ ok: true });
}
