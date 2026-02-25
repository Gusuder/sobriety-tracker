import type { DayEntry, CrisisSession } from "@/domain/types";
import type { CravingLevel, MoodLevel, TriggerId } from "@/domain/enums";

export type ExportBlobV1 = {
  version: 1;
  exportedAt: number;
  dayEntries: DayEntry[];
  crisisSessions: CrisisSession[];
};

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isStr(v: unknown): v is string {
  return typeof v === "string";
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isBool(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

const CRAVING: CravingLevel[] = ["none", "low", "mid", "high", "very_high"];
const MOOD: MoodLevel[] = ["awful", "bad", "ok", "good", "great"];
const TRIGGERS: TriggerId[] = [
  "stress",
  "boredom",
  "company",
  "loneliness",
  "fatigue",
  "holiday",
  "conflict",
  "anxiety",
  "ritual",
  "availability",
];

function isCraving(v: unknown): v is CravingLevel {
  return isStr(v) && (CRAVING as string[]).includes(v);
}

function isMood(v: unknown): v is MoodLevel {
  return isStr(v) && (MOOD as string[]).includes(v);
}

function isTrigger(v: unknown): v is TriggerId {
  return isStr(v) && (TRIGGERS as string[]).includes(v);
}

// YYYY-MM-DD базово
function isDateKey(v: unknown): v is string {
  return isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function isDayEntry(v: unknown): v is DayEntry {
  if (!isObj(v)) return false;
  return (
    isDateKey(v.dateKey) &&
    isBool(v.isSober) &&
    isCraving(v.craving) &&
    isMood(v.mood) &&
    isArray(v.triggers) &&
    v.triggers.every(isTrigger) &&
    isStr(v.note) &&
    isNum(v.createdAt) &&
    isNum(v.updatedAt)
  );
}

function isCrisisSession(v: unknown): v is CrisisSession {
  if (!isObj(v)) return false;

  const resultOk = v.result === "better" || v.result === "same";
  const gameOk = v.gameType === undefined || v.gameType === "match3";

  return (
    isStr(v.id) &&
    isNum(v.startAt) &&
    isNum(v.endAt) &&
    isNum(v.durationSec) &&
    isBool(v.usedBreathing) &&
    isBool(v.usedSupportText) &&
    isBool(v.usedGame) &&
    gameOk &&
    resultOk
  );
}

export function parseExportBlob(json: unknown): { ok: true; value: ExportBlobV1 } | { ok: false; error: string } {
  if (!isObj(json)) return { ok: false, error: "Файл не похож на JSON-объект." };
  if (json.version !== 1) return { ok: false, error: "Неверная версия экспорта (ожидается version: 1)." };
  if (!isNum(json.exportedAt)) return { ok: false, error: "Поле exportedAt некорректно." };

  const dayEntries = (json.dayEntries ?? null) as unknown;
  const crisisSessions = (json.crisisSessions ?? null) as unknown;

  if (!isArray(dayEntries)) return { ok: false, error: "dayEntries должен быть массивом." };
  if (!isArray(crisisSessions)) return { ok: false, error: "crisisSessions должен быть массивом." };

  if (!dayEntries.every(isDayEntry)) return { ok: false, error: "В dayEntries есть некорректные записи." };
  if (!crisisSessions.every(isCrisisSession)) return { ok: false, error: "В crisisSessions есть некорректные записи." };

  return {
    ok: true,
    value: {
      version: 1,
      exportedAt: json.exportedAt,
      dayEntries: dayEntries as DayEntry[],
      crisisSessions: crisisSessions as CrisisSession[],
    },
  };
}