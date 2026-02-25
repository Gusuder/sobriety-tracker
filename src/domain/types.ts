import type { CravingLevel, MoodLevel, TriggerId } from "./enums";

export type DayEntry = {
  dateKey: string; // YYYY-MM-DD (локальное время)
  isSober: boolean;
  craving: CravingLevel;
  mood: MoodLevel;
  triggers: TriggerId[];
  note: string;
  createdAt: number;
  updatedAt: number;
};

export type CrisisSession = {
  id: string;
  startAt: number;
  endAt: number;
  durationSec: number;

  usedBreathing: boolean;
  usedSupportText: boolean;
  usedGame: boolean;
  gameType?: "match3";
  result: "better" | "same";
};