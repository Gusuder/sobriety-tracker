import type { DayEntry } from "@/domain/types";

function prevDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function calcCurrentStreak(entriesByKey: Map<string, DayEntry>, startKey: string): number {
  // правило: пропуск дня обрывает стрик
  let streak = 0;
  let key = startKey;

  while (true) {
    const e = entriesByKey.get(key);
    if (!e) break;
    if (!e.isSober) break;

    streak += 1;
    key = prevDateKey(key);
  }

  return streak;
}

export function calcBestStreak(all: DayEntry[]): number {
  if (all.length === 0) return 0;

  const sorted = [...all].sort((a, b) => (a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0));

  let best = 0;
  let cur = 0;
  let prevKey: string | null = null;

  for (const e of sorted) {
    if (!e.isSober) {
      cur = 0;
      prevKey = e.dateKey;
      continue;
    }

    if (prevKey === null) {
      cur = 1;
    } else {
      const expected = prevDateKey(e.dateKey); // вчера относительно текущего
      // мы идём по возрастанию, значит "e" позже. Проверим что prevKey = вчера для e
      // проще: сравним prevKey с prevDateKey(e.dateKey)
      if (prevKey === prevDateKey(e.dateKey)) cur += 1;
      else cur = 1;
    }

    best = Math.max(best, cur);
    prevKey = e.dateKey;
  }

  return best;
}