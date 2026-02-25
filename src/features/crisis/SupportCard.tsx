"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "Тяга — это волна. Она поднимется и спадёт.",
  "Твоя задача сейчас: продержаться 10 минут.",
  "Сейчас не нужно решать «навсегда». Только «сегодня».",
  "Ты не обязан быть идеальным, чтобы двигаться вперёд.",
  "Сделай один маленький шаг: вода, воздух, движение.",
  "Тяга — это сигнал, не приказ.",
  "Если очень тяжело — просто не делай первый глоток.",
];

function pickRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function SupportCard({ onUsed }: { onUsed: () => void }) {
  const [text, setText] = useState<string>("…");

  useEffect(() => {
    // рандом только на клиенте после гидрации
    setText(pickRandom(PHRASES));
  }, []);

  function next() {
    onUsed();
    let t = text;
    while (t === text) t = pickRandom(PHRASES);
    setText(t);
  }

  return (
    <section className="rounded border p-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Поддержка</div>
        <button className="rounded bg-gray-200 px-3 py-1 text-sm" onClick={next}>
          Ещё
        </button>
      </div>

      <div className="mt-3 rounded bg-gray-100 p-3 text-sm">{text}</div>
    </section>
  );
}