"use client";

import { useState } from "react";
import { MotionPage } from "@/components/MotionPage";
import { BreathingCard } from "@/features/crisis/BreathingCard";
import { SupportCard } from "@/features/crisis/SupportCard";
import { Match3Game } from "@/features/crisis/Match3Game";

const card = "rounded-2xl border border-[var(--border)] bg-white/80 backdrop-blur p-4 shadow-sm";
const muted = "text-[var(--muted)]";

export default function Page() {
  const [used, setUsed] = useState({ breathing: false, support: false, game: false });

  return (
    <MotionPage>
      <main className="mx-auto max-w-md p-4 space-y-4">
        <header>
          <h1 className="text-xl font-bold">Кризисный режим</h1>
          <p className={`text-sm ${muted}`}>Сейчас не нужно решать «навсегда». Только «сегодня».</p>
        </header>

        <section className={card}>
          <div className="font-semibold">План на 10 минут</div>
          <ol className={`mt-2 list-decimal pl-5 text-sm ${muted} space-y-1`}>
            <li>Сделай дыхание 60–90 секунд.</li>
            <li>Прочитай поддержку, переключи фразу.</li>
            <li>Сыграй короткий раунд “собери 3”.</li>
          </ol>
        </section>

        <BreathingCard onUsed={() => setUsed((p) => ({ ...p, breathing: true }))} />
        <SupportCard onUsed={() => setUsed((p) => ({ ...p, support: true }))} />
        <Match3Game onUsed={() => setUsed((p) => ({ ...p, game: true }))} />

        <section className={card}>
          <div className="font-semibold">Отметка</div>
          <div className={`mt-2 text-sm ${muted}`}>
            Использовано: дыхание — {used.breathing ? "да" : "нет"}, поддержка — {used.support ? "да" : "нет"}, игра —{" "}
            {used.game ? "да" : "нет"}.
          </div>
        </section>
      </main>
    </MotionPage>
  );
}