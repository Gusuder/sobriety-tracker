"use client";

import { useEffect, useMemo, useState } from "react";

type Phase = "inhale" | "hold" | "exhale";

function phaseLabel(p: Phase) {
  if (p === "inhale") return "Вдох";
  if (p === "hold") return "Пауза";
  return "Выдох";
}

export function BreathingCard({ onUsed }: { onUsed: () => void }) {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [secLeft, setSecLeft] = useState(4);
  const [cyclesLeft, setCyclesLeft] = useState(5);

  const plan = useMemo(() => {
    // 4-4-6
    return [
      { phase: "inhale" as const, seconds: 4 },
      { phase: "hold" as const, seconds: 4 },
      { phase: "exhale" as const, seconds: 6 },
    ];
  }, []);

  useEffect(() => {
    if (!running) return;

    let idx = plan.findIndex((p) => p.phase === phase);
    const t = setInterval(() => {
      setSecLeft((s) => {
        if (s > 1) return s - 1;

        // перейти к следующей фазе
        idx = (idx + 1) % plan.length;
        const next = plan[idx];

        setPhase(next.phase);
        if (idx === 0) {
          setCyclesLeft((c) => Math.max(0, c - 1));
        }
        return next.seconds;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [running, phase, plan]);

  useEffect(() => {
    if (!running) return;
    if (cyclesLeft <= 0) setRunning(false);
  }, [cyclesLeft, running]);

  function start() {
    onUsed();
    setCyclesLeft(5);
    setPhase("inhale");
    setSecLeft(4);
    setRunning(true);
  }

  function stop() {
    setRunning(false);
  }

  return (
    <section className="rounded border p-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Дыхание (4–4–6)</div>
        {running ? (
          <button className="rounded bg-gray-200 px-3 py-1 text-sm" onClick={stop}>
            Стоп
          </button>
        ) : (
          <button className="rounded bg-black text-white px-3 py-1 text-sm" onClick={start}>
            Старт
          </button>
        )}
      </div>

      <div className="mt-3 rounded bg-gray-100 p-3 text-center">
        <div className="text-sm text-gray-500">{phaseLabel(phase)}</div>
        <div className="text-3xl font-bold">{secLeft}</div>
        <div className="text-xs text-gray-500">Циклов осталось: {cyclesLeft}</div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Если сложно — просто делай медленный выдох. Это уже помогает.
      </div>
    </section>
  );
}