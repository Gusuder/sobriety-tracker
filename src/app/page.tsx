"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DayEntry } from "@/domain/types";
import { todayKey } from "@/utils/date";
import { getDayEntry, listDayEntries } from "@/db/dayEntries";
import { calcBestStreak, calcCurrentStreak } from "@/domain/streak";
import { CRAVING_OPTIONS, MOOD_OPTIONS, TRIGGERS } from "@/domain/labels";
import type { TriggerId } from "@/domain/enums";
import { MotionPage } from "@/components/MotionPage";

const card = "rounded-2xl border border-[var(--border)] bg-white/80 backdrop-blur p-4 shadow-sm";
const btnPrimary =
  "rounded-xl bg-[var(--accent)] text-white px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50";
const btnSoft =
  "rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm transition active:scale-[0.98]";
const muted = "text-[var(--muted)]";

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
    <MotionPage>
      <main className="mx-auto max-w-md p-4 space-y-4">
        <header className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold">Сегодня</h1>
          <span className={`text-xs ${muted}`}>{key}</span>
        </header>

        <section className={card}>
          <div className="flex justify-between items-center gap-4">
            <div>
              <div className={`text-sm ${muted}`}>Стрик</div>
              <div className="text-3xl font-bold">{currentStreak} дн.</div>
              <div className={`text-xs ${muted}`}>Лучший: {bestStreak} дн.</div>
            </div>

            <Link className={btnPrimary} href={checkinHref}>
              {today ? "Редактировать" : "Заполнить"}
            </Link>
          </div>
        </section>

        <section className={card}>
          <div className={`text-sm ${muted}`}>Статус дня</div>

          {todayStatus === "no-entry" ? (
            <div className="mt-1">
              <div className="font-semibold">Записи на сегодня нет</div>
              <div className={`text-sm ${muted}`}>Заполни чек-ин — это 30–60 секунд.</div>
              <div className="mt-3">
                <Link className={btnSoft} href={checkinHref}>
                  Открыть чек-ин
                </Link>
              </div>
            </div>
          ) : todayStatus === "sober" ? (
            <div className="mt-1">
              <div className="font-semibold">✅ Сегодня трезвый</div>
              <div className={`text-sm ${muted}`}>
                Тяга: {labelByValue(CRAVING_OPTIONS, today!.craving)} · Настроение:{" "}
                {labelByValue(MOOD_OPTIONS, today!.mood)}
              </div>
            </div>
          ) : (
            <div className="mt-1">
              <div className="font-semibold">◼ Был алкоголь</div>
              <div className={`text-sm ${muted}`}>Мы фиксируем факт. Завтра — новый день.</div>
            </div>
          )}

          {today && (today.triggers.length > 0 || today.note.trim()) ? (
            <div className="mt-3 space-y-2">
              {today.triggers.length > 0 ? (
                <div className="text-sm">
                  <span className={muted}>Триггеры:</span> {today.triggers.map(triggerLabel).join(", ")}
                </div>
              ) : null}

              {today.note.trim() ? (
                <div className="text-sm">
                  <span className={muted}>Заметка:</span> {today.note}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <Link
          className="block text-center rounded-2xl border border-[var(--border)] bg-[var(--accent-weak)] px-4 py-4 font-semibold transition active:scale-[0.99]"
          href="/crisis"
        >
          Мне тяжело (кризисный режим)
        </Link>
      </main>
    </MotionPage>
  );
}