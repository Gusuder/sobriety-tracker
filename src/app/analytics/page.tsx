"use client";

import { useEffect, useMemo, useState } from "react";
import { MotionPage } from "@/components/MotionPage";
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

const card = "rounded-2xl border border-[var(--border)] bg-white/80 backdrop-blur p-4 shadow-sm";
const pill = "rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm transition active:scale-[0.98]";
const soft = "rounded-xl bg-[var(--accent-weak)] px-3 py-2";
const muted = "text-[var(--muted)]";

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

    // типы без any
    setCravingDist(Object.entries(a.cravingCounts).sort((x, y) => y[1] - x[1]) as [CravingLevel, number][]);
    setMoodDist(Object.entries(a.moodCounts).sort((x, y) => y[1] - x[1]) as [MoodLevel, number][]);

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
    <MotionPage>
      <main className="mx-auto max-w-md p-4 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Аналитика</h1>
            <div className={`text-xs ${muted}`}>Период: с {fromKey}</div>
          </div>

          <select className={pill} value={range} onChange={(e) => setRange(Number(e.target.value) as RangeDays)}>
            <option value={7}>7 дней</option>
            <option value={30}>30 дней</option>
            <option value={90}>90 дней</option>
          </select>
        </header>

        {loading ? (
          <div className={`text-sm ${muted}`}>Загрузка…</div>
        ) : (
          <>
            <section className={card}>
              <div className={`text-sm ${muted}`}>Итоги</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div className={soft}>
                  <div className={`text-xs ${muted}`}>Дней с записями</div>
                  <div className="text-lg font-semibold">{entriesCount}</div>
                </div>
                <div className={soft}>
                  <div className={`text-xs ${muted}`}>Трезвых</div>
                  <div className="text-lg font-semibold">{soberDays}</div>
                </div>
                <div className={soft}>
                  <div className={`text-xs ${muted}`}>Дней с алкоголем</div>
                  <div className="text-lg font-semibold">{notSoberDays}</div>
                </div>
              </div>
            </section>

            <section className={card}>
              <div className="font-semibold">Топ триггеров</div>
              {topTriggers.length === 0 ? (
                <div className={`text-sm ${muted} mt-2`}>Нет данных</div>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {topTriggers.map(([id, c]) => (
                    <li key={id} className="flex justify-between">
                      <span>{triggerLabel(id)}</span>
                      <span className={muted}>{c}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={card}>
              <div className="font-semibold">Триггеры в дни с алкоголем</div>
              {topTriggersNS.length === 0 ? (
                <div className={`text-sm ${muted} mt-2`}>Нет данных</div>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {topTriggersNS.map(([id, c]) => (
                    <li key={id} className="flex justify-between">
                      <span>{triggerLabel(id)}</span>
                      <span className={muted}>{c}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={card}>
              <div className="font-semibold">Распределение тяги</div>
              {cravingDist.length === 0 ? (
                <div className={`text-sm ${muted} mt-2`}>Нет данных</div>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {cravingDist.map(([lvl, c]) => (
                    <li key={lvl} className="flex justify-between">
                      <span>{labelByValue(CRAVING_OPTIONS, lvl)}</span>
                      <span className={muted}>{c}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={card}>
              <div className="font-semibold">Распределение настроения</div>
              {moodDist.length === 0 ? (
                <div className={`text-sm ${muted} mt-2`}>Нет данных</div>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {moodDist.map(([lvl, c]) => (
                    <li key={lvl} className="flex justify-between">
                      <span>{labelByValue(MOOD_OPTIONS, lvl)}</span>
                      <span className={muted}>{c}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={card}>
              <div className="font-semibold">Кризисные сессии</div>
              <div className="mt-3 text-sm">
                Всего: <b>{crisisCount}</b>
              </div>
              <div className={`text-sm ${muted}`}>
                Стало легче: <b className="text-[var(--text)]">{crisisBetter}</b> · Не отпустило:{" "}
                <b className="text-[var(--text)]">{crisisSame}</b>
              </div>
            </section>

            <button className={`w-full ${pill}`} onClick={load}>
              Обновить
            </button>
          </>
        )}
      </main>
    </MotionPage>
  );
}