"use client";

import { useEffect, useRef, useState } from "react";
import { BreathingCard } from "@/features/crisis/BreathingCard";
import { SupportCard } from "@/features/crisis/SupportCard";
import { Match3Game } from "@/features/crisis/Match3Game";
import { uuid } from "@/utils/uuid";
import { addCrisisSession } from "@/db/crisisSessions";
import type { CrisisSession } from "@/domain/types";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const startAtRef = useRef<number>(Date.now());
  const [usedBreathing, setUsedBreathing] = useState(false);
  const [usedSupportText, setUsedSupportText] = useState(false);
  const [usedGame, setUsedGame] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    startAtRef.current = Date.now();
  }, []);

  async function finish(result: "better" | "same") {
    setSaving(true);
    setMsg("");

    const endAt = Date.now();
    const s: CrisisSession = {
      id: uuid(),
      startAt: startAtRef.current,
      endAt,
      durationSec: Math.max(1, Math.round((endAt - startAtRef.current) / 1000)),
      usedBreathing,
      usedSupportText,
      usedGame,
      gameType: usedGame ? "match3" : undefined,
      result,
    };

    await addCrisisSession(s);
    setMsg("Сессия сохранена ✅");
    setSaving(false);

    // уводим на главную
    router.push("/");
  }

  return (
    <main className="mx-auto max-w-md p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Кризисный режим</h1>
        <button className="rounded bg-gray-200 px-3 py-2 text-sm" onClick={() => router.push("/")}>
          Закрыть
        </button>
      </header>

      <div className="text-sm text-gray-600">
        Сделай один шаг: дыхание, поддержка или мини-игра. Твоя задача — переждать волну.
      </div>

      <BreathingCard onUsed={() => setUsedBreathing(true)} />
      <SupportCard onUsed={() => setUsedSupportText(true)} />
      <Match3Game onUsed={() => setUsedGame(true)} />

      {msg ? <div className="text-sm">{msg}</div> : null}

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          disabled={saving}
          className="rounded bg-black text-white px-3 py-3 font-semibold disabled:opacity-50"
          onClick={() => finish("better")}
        >
          Стало легче
        </button>
        <button
          disabled={saving}
          className="rounded bg-gray-200 px-3 py-3 font-semibold disabled:opacity-50"
          onClick={() => finish("same")}
        >
          Не отпустило
        </button>
      </div>

      <div className="text-xs text-gray-500">
        Нажатие кнопки сохранит кризисную сессию локально. Никаких данных наружу.
      </div>
    </main>
  );
}