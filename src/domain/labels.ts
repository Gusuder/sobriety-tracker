import type { CravingLevel, MoodLevel, TriggerId } from "./enums";

export const CRAVING_OPTIONS: { value: CravingLevel; label: string }[] = [
  { value: "none", label: "Нет" },
  { value: "low", label: "Слабая" },
  { value: "mid", label: "Средняя" },
  { value: "high", label: "Сильная" },
  { value: "very_high", label: "Очень сильная" },
];

export const MOOD_OPTIONS: { value: MoodLevel; label: string }[] = [
  { value: "awful", label: "Ужасно" },
  { value: "bad", label: "Плохо" },
  { value: "ok", label: "Нормально" },
  { value: "good", label: "Хорошо" },
  { value: "great", label: "Отлично" },
];

export const TRIGGERS: { id: TriggerId; label: string }[] = [
  { id: "stress", label: "Стресс" },
  { id: "boredom", label: "Скука" },
  { id: "company", label: "Компания" },
  { id: "loneliness", label: "Одиночество" },
  { id: "fatigue", label: "Усталость" },
  { id: "holiday", label: "Праздник" },
  { id: "conflict", label: "Конфликт" },
  { id: "anxiety", label: "Тревога" },
  { id: "ritual", label: "Привычный ритуал" },
  { id: "availability", label: "Доступность алкоголя" },
];