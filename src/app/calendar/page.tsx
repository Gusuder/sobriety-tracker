"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DayEntry } from "@/domain/types";
import { listDayEntriesRange } from "@/db/dayEntries";
import { todayKey } from "@/utils/date";
import { daysInMonthGrid, monthBounds, monthTitle } from "@/utils/calendar";
import { MotionPage } from "@/components/MotionPage";

const card = "rounded-2xl border border-[var(--border)] bg-white/80 backdrop-blur p-4 shadow-sm";
const btnSoft =
  "rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm transition active:scale-[0.98]";
const muted = "text-[var(--muted)]";

type DayStatus = "empty" | "sober" | "not_sober";

function statusOf(entry?: DayEntry): DayStatus {
  if (!entry) return "empty";
  return entry.isSober ? "sober" : "not_sober";
}

export default function Page() {
  const [cursor, setCursor] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const [entriesByKey, setEntriesByKey] = useState<Map<string, DayEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  const grid = useMemo(() => daysInMonthGrid(cursor), [cursor]);
  const title = useMemo(() => monthTitle(cursor), [cursor]);

  async function loadMonth() {
    setLoading(true);
    const { fromKey, toKey } = monthBounds(cursor);
    const rows = await listDayEntriesRange(fromKey, toKey);
    setEntriesByKey(new Map(rows.map((e) => [e.dateKey, e] as const)));
    setLoading(false);
  }

  useEffect(() => {
    loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  function prevMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const today = todayKey();

  return (
    <MotionPage>
      <main className="mx-auto max-w-md p-4 space-y-3">
        <header className="flex items-center justify-between">
          <button className={btnSoft} onClick={prevMonth}>
            ←
          </button>
          <div className="font-semibold capitalize">{title}</div>
          <button className={btnSoft} onClick={nextMonth}>
            →
          </button>
        </header>

        <section className={card}>
          <div className="grid grid-cols-7 text-xs text-[var(--muted)]">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
              <div key={d} className="py-1 text-center">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mt-2">
            {grid.map((cell) => {
              const e = entriesByKey.get(cell.dateKey);
              const st = statusOf(e);
              const isToday = cell.dateKey === today;
              const hasNote = Boolean(e?.note?.trim());

              let base =
                "h-12 rounded-xl border border-[var(--border)] flex flex-col items-center justify-center text-sm relative transition active:scale-[0.98] bg-white";
              if (!cell.inMonth) base += " opacity-40";
              if (isToday) base += " ring-2 ring-[var(--accent)]";

              if (st === "sober") base += " bg-[var(--accent-weak)] border-transparent";
              if (st === "not_sober") base += " bg-white/60";

              let badge = "○";
              if (st === "sober") badge = "✅";
              if (st === "not_sober") badge = "◼";

              return (
                <Link key={cell.dateKey} href={`/checkin?date=${cell.dateKey}`} className={base} title={cell.dateKey}>
                  <div className="text-[10px] leading-none">{badge}</div>
                  <div className="leading-none">{cell.date.getDate()}</div>
                  {hasNote ? <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" /> : null}
                </Link>
              );
            })}
          </div>

          <div className={`mt-3 text-xs ${muted}`}>{loading ? "Загрузка..." : "Нажми на день, чтобы открыть чек-ин."}</div>

          <button className={`mt-3 w-full ${btnSoft}`} onClick={loadMonth}>
            Обновить
          </button>
        </section>
      </main>
    </MotionPage>
  );
}