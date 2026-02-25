"use client";

import { useEffect, useMemo, useState } from "react";
import { listDayEntries } from "@/db/dayEntries";
import { listCrisisSessions } from "@/db/crisisSessions";
import { computeAnalytics, sinceDateKey, topN, type RangeDays } from "@/domain/analytics";
import { CRAVING_OPTIONS, MOOD_OPTIONS, TRIGGERS } from "@/domain/labels";
import type { CravingLevel, MoodLevel, TriggerId } from "@/domain/enums";

function labelByValue<T extends string>(opts: { value: T; label: string }[], v: T) {
  return opts.find((o) => o.value === v)?.label ?? v;
}

function triggerLabel(id: TriggerId) {
  return TRIGGERS.find((t) => t.id === id)?.label ?? id;
}

export default function Page() {
  const [range, setRange] = useState<RangeDays>(30);
  const [loading, setLoading] = useState(true);

  const [entriesCount, setEntriesCount] = useState(0);
  const [soberDays, setSoberDays] = useState(0);
  const [notSoberDays, setNotSoberDays] = useState(0);

  const [topTriggers, setTopTriggers] = useState<[TriggerId, number][]>([]);
  const [topTriggersNS, setTopTriggersNS] = useState<[TriggerId, number][]>([]);

  const [cravingDist, setCravingDist] = useState<[CravingLevel, number][]>([]);
  const [moodDist, setMoodDist] = useState<[MoodLevel, number][]>([]);

  const [crisisCount, setCrisisCount] = useState(0);
  const [crisisBetter, setCrisisBetter] = useState(0);
  const [crisisSame, setCrisisSame] = useState(0);

  const fromKey = useMemo(() => sinceDateKey(range), [range]);

  async function load() {
    setLoading(true);
    const all = await listDayEntries();
    const entries = all.filter((e) => e.dateKey >= fromKey);

    const sessionsAll = await listCrisisSessions();
    const fromTs = Date.now() - (range - 1) * 24 * 60 * 60 * 1000;
    const sessions = sessionsAll.filter((s) => s.startAt >= fromTs);

    const a = computeAnalytics(entries, sessions);

    setEntriesCount(a.totalDaysWithEntries);
    setSoberDays(a.soberDays);
    setNotSoberDays(a.notSoberDays);

    setTopTriggers(topN(a.triggerCounts, 5));
    setTopTriggersNS(topN(a.triggerCountsNotSober, 5));

    setCravingDist(Object.entries(a.cravingCounts).sort((a, b) => b[1] - a[1]) as any);
    setMoodDist(Object.entries(a.moodCounts).sort((a, b) => b[1] - a[1]) as any);

    setCrisisCount(a.crisisCount);
    setCrisisBetter(a.crisisBetter);
    setCrisisSame(a.crisisSame);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <main className="mx-auto max-w-md p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Аналитика</h1>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={range}
          onChange={(e) => setRange(Number(e.target.value) as RangeDays)}
        >
          <option value={7}>7 дней</option>
          <option value={30}>30 дней</option>
          <option value={90}>90 дней</option>
        </select>
      </header>

      <div className="text-xs text-gray-500">Период: с {fromKey}</div>

      {loading ? (
        <div className="text-sm text-gray-500">Загрузка…</div>
      ) : (
        <>
          <section className="rounded border p-3">
            <div className="text-sm text-gray-500">Итоги</div>
            <div className="mt-1 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded bg-gray-100 p-2">
                <div className="text-xs text-gray-500">Дней с записями</div>
                <div className="text-lg font-semibold">{entriesCount}</div>
              </div>
              <div className="rounded bg-gray-100 p-2">
                <div className="text-xs text-gray-500">✅ Трезвых</div>
                <div className="text-lg font-semibold">{soberDays}</div>
              </div>
              <div className="rounded bg-gray-100 p-2">
                <div className="text-xs text-gray-500">❌ Срывов</div>
                <div className="text-lg font-semibold">{notSoberDays}</div>
              </div>
            </div>
          </section>

          <section className="rounded border p-3">
            <div className="font-semibold">Топ триггеров</div>
            {topTriggers.length === 0 ? (
              <div className="text-sm text-gray-500 mt-1">Нет данных</div>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {topTriggers.map(([id, c]) => (
                  <li key={id} className="flex justify-between">
                    <span>{triggerLabel(id)}</span>
                    <span className="text-gray-500">{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded border p-3">
            <div className="font-semibold">Триггеры в дни ❌</div>
            {topTriggersNS.length === 0 ? (
              <div className="text-sm text-gray-500 mt-1">Нет данных</div>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {topTriggersNS.map(([id, c]) => (
                  <li key={id} className="flex justify-between">
                    <span>{triggerLabel(id)}</span>
                    <span className="text-gray-500">{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded border p-3">
            <div className="font-semibold">Распределение тяги</div>
            {cravingDist.length === 0 ? (
              <div className="text-sm text-gray-500 mt-1">Нет данных</div>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {cravingDist.map(([lvl, c]) => (
                  <li key={lvl} className="flex justify-between">
                    <span>{labelByValue(CRAVING_OPTIONS, lvl)}</span>
                    <span className="text-gray-500">{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded border p-3">
            <div className="font-semibold">Распределение настроения</div>
            {moodDist.length === 0 ? (
              <div className="text-sm text-gray-500 mt-1">Нет данных</div>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {moodDist.map(([lvl, c]) => (
                  <li key={lvl} className="flex justify-between">
                    <span>{labelByValue(MOOD_OPTIONS, lvl)}</span>
                    <span className="text-gray-500">{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded border p-3">
            <div className="font-semibold">Кризисные сессии</div>
            <div className="mt-2 text-sm text-gray-700">
              Всего: <b>{crisisCount}</b>
            </div>
            <div className="text-sm text-gray-700">
              Стало легче: <b>{crisisBetter}</b> · Не отпустило: <b>{crisisSame}</b>
            </div>
          </section>

          <button className="w-full rounded bg-gray-200 px-3 py-2 text-sm" onClick={load}>
            Обновить
          </button>
        </>
      )}
    </main>
  );
}