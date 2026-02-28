import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sqlite } from "./sqlite";

const SESSION_COOKIE = "st_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [salt, keyHex] = encoded.split(":");
  if (!salt || !keyHex) return false;
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
  const stored = Buffer.from(keyHex, "hex");
  if (stored.length !== key.length) return false;
  return crypto.timingSafeEqual(stored, key);
}

export async function createSession(userId: number): Promise<void> {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = sha256(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  sqlite.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  sqlite
    .prepare("INSERT INTO sessions(token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .run(tokenHash, userId, expiresAt, now);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    sqlite.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getAuthedUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = sqlite
    .prepare("SELECT user_id, expires_at FROM sessions WHERE token_hash = ?")
    .get(sha256(token)) as { user_id: number; expires_at: number } | undefined;

  if (!row) return null;
  if (row.expires_at < Date.now()) {
    sqlite.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }
  return row.user_id;
}

export function authError() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
