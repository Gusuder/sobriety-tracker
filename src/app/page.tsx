"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DayEntry } from "@/domain/types";
import { todayKey } from "@/utils/date";
import { getDayEntry, listDayEntries } from "@/db/dayEntries";
import { calcBestStreak, calcCurrentStreak } from "@/domain/streak";
import { CRAVING_OPTIONS, MOOD_OPTIONS, TRIGGERS } from "@/domain/labels";
import type { TriggerId } from "@/domain/enums";

function labelByValue<T extends string>(opts: { value: T; label: string }[], v: T) {
  return opts.find((o) => o.value === v)?.label ?? v;
}

function triggerLabel(id: TriggerId) {
  return TRIGGERS.find((t) => t.id === id)?.label ?? id;
}

export default function Page() {
  const key = todayKey();

  const [today, setToday] = useState<DayEntry | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const todayStatus = useMemo(() => {
    if (!today) return "no-entry";
    return today.isSober ? "sober" : "not-sober";
  }, [today]);

  async function refresh() {
    const t = await getDayEntry(key);
    setToday(t ?? null);

    const all = await listDayEntries();
    const map = new Map(all.map((e) => [e.dateKey, e] as const));

    setCurrentStreak(calcCurrentStreak(map, key));
    setBestStreak(calcBestStreak(all));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UX-минимум: обновляемся, когда возвращаемся в вкладку/окно
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") refresh();
    }
    function onFocus() {
      refresh();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkinHref = today ? `/checkin?date=${key}` : "/checkin";

  return (
    <main className="mx-auto max-w-md p-4 space-y-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">Сегодня</h1>
        <span className="text-xs text-gray-500">{key}</span>
      </header>

      <section className="rounded border p-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">Стрик</div>
            <div className="text-2xl font-bold">{currentStreak} дн.</div>
            <div className="text-xs text-gray-500">Лучший: {bestStreak} дн.</div>
          </div>

          <Link className="rounded bg-black text-white px-3 py-2 text-sm" href={checkinHref}>
            {today ? "Редактировать" : "Заполнить"}
          </Link>
        </div>
      </section>

      <section className="rounded border p-3">
        <div className="text-sm text-gray-500">Статус дня</div>

        {todayStatus === "no-entry" ? (
          <div className="mt-1">
            <div className="font-semibold">Записи на сегодня нет</div>
            <div className="text-sm text-gray-500">Заполни чек-ин — это 30–60 секунд.</div>
          </div>
        ) : todayStatus === "sober" ? (
          <div className="mt-1">
            <div className="font-semibold">✅ Сегодня трезвый</div>
            <div className="text-sm text-gray-500">
              Тяга: {labelByValue(CRAVING_OPTIONS, today!.craving)} · Настроение:{" "}
              {labelByValue(MOOD_OPTIONS, today!.mood)}
            </div>
          </div>
        ) : (
          <div className="mt-1">
            <div className="font-semibold">❌ Был алкоголь</div>
            <div className="text-sm text-gray-500">Мы просто фиксируем факт. Завтра — новый день.</div>
          </div>
        )}

        {today && (today.triggers.length > 0 || today.note.trim()) ? (
          <div className="mt-3 space-y-2">
            {today.triggers.length > 0 ? (
              <div className="text-sm">
                <span className="text-gray-500">Триггеры:</span>{" "}
                {today.triggers.map(triggerLabel).join(", ")}
              </div>
            ) : null}

            {today.note.trim() ? (
              <div className="text-sm">
                <span className="text-gray-500">Заметка:</span> {today.note}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <Link className="block text-center rounded bg-gray-900 text-white px-3 py-3 font-semibold" href="/crisis">
        Мне тяжело (кризисный режим)
      </Link>
    </main>
  );
}