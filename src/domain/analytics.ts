import type { DayEntry, CrisisSession } from "@/domain/types";
import type { CravingLevel, MoodLevel, TriggerId } from "@/domain/enums";

export type RangeDays = 7 | 30 | 90;

export function sinceDateKey(rangeDays: RangeDays): string {
  const d = new Date();
  d.setDate(d.getDate() - (rangeDays - 1));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function countBy<T extends string>(items: T[]): Record<T, number> {
  const res = {} as Record<T, number>;
  for (const it of items) res[it] = (res[it] ?? 0) + 1;
  return res;
}

export function topN<T extends string>(counts: Partial<Record<T, number>>, n: number): [T, number][] {
  const entries: [T, number][] = Object.keys(counts).map((k) => [k as T, counts[k as T] ?? 0]);
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, n);
}

export type AnalyticsResult = {
  totalDaysWithEntries: number;
  soberDays: number;
  notSoberDays: number;

  triggerCounts: Record<TriggerId, number>;
  triggerCountsNotSober: Record<TriggerId, number>;

  cravingCounts: Record<CravingLevel, number>;
  moodCounts: Record<MoodLevel, number>;

  crisisCount: number;
  crisisBetter: number;
  crisisSame: number;
};

export function computeAnalytics(entries: DayEntry[], sessions: CrisisSession[]): AnalyticsResult {
  const triggerCounts = {} as Record<TriggerId, number>;
  const triggerCountsNotSober = {} as Record<TriggerId, number>;
  const cravingCounts = {} as Record<CravingLevel, number>;
  const moodCounts = {} as Record<MoodLevel, number>;

  let soberDays = 0;
  let notSoberDays = 0;

  for (const e of entries) {
    if (e.isSober) soberDays += 1;
    else notSoberDays += 1;

    cravingCounts[e.craving] = (cravingCounts[e.craving] ?? 0) + 1;
    moodCounts[e.mood] = (moodCounts[e.mood] ?? 0) + 1;

    for (const t of e.triggers) {
      triggerCounts[t] = (triggerCounts[t] ?? 0) + 1;
      if (!e.isSober) triggerCountsNotSober[t] = (triggerCountsNotSober[t] ?? 0) + 1;
    }
  }

  let crisisBetter = 0;
  let crisisSame = 0;
  for (const s of sessions) {
    if (s.result === "better") crisisBetter += 1;
    else crisisSame += 1;
  }

  return {
    totalDaysWithEntries: entries.length,
    soberDays,
    notSoberDays,
    triggerCounts,
    triggerCountsNotSober,
    cravingCounts,
    moodCounts,
    crisisCount: sessions.length,
    crisisBetter,
    crisisSame,
  };
}