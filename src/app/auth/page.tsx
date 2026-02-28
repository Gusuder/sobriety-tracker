"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const card = "rounded-2xl border border-[var(--border)] bg-white/80 backdrop-blur p-4 shadow-sm";
const btnPrimary =
  "rounded-xl bg-[var(--accent)] text-white px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Ошибка авторизации");
        return;
      }
      router.replace("/");
    } catch {
      setMsg("Не удалось подключиться к серверу");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-4 space-y-4 min-h-screen flex flex-col justify-center">
      <section className={card}>
        <h1 className="text-xl font-bold">Sobriety Tracker</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Войдите, чтобы ваши данные хранились в аккаунте и были доступны с любого устройства.
        </p>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            className={`rounded-xl border px-3 py-2 text-sm ${mode === "login" ? "bg-[var(--accent-weak)]" : "bg-white"}`}
            onClick={() => setMode("login")}
          >
            Вход
          </button>
          <button
            className={`rounded-xl border px-3 py-2 text-sm ${mode === "register" ? "bg-[var(--accent-weak)]" : "bg-white"}`}
            onClick={() => setMode("register")}
          >
            Регистрация
          </button>
        </div>

        <label className="block mt-4 text-sm">
          Логин
          <input
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
        </label>

        <label className="block mt-3 text-sm">
          Пароль
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {msg ? <div className="mt-3 text-sm text-[#B4534E]">{msg}</div> : null}

        <button className={`mt-4 w-full ${btnPrimary}`} onClick={submit} disabled={loading || !login || !password}>
          {loading ? "Подождите..." : mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>
      </section>
    </main>
  );
}
