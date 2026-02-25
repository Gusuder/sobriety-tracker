import type { DayEntry } from "@/domain/types";

export type ValidationError = { field: "isSober" | "note"; message: string };

export function validateDayEntryDraft(draft: {
  isSober: boolean | null;
  note: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (draft.isSober === null) {
    errors.push({ field: "isSober", message: "Выбери: сегодня трезвый — Да или Нет." });
  }

  const note = draft.note.trim();
  if (note.length > 1000) {
    errors.push({ field: "note", message: "Заметка слишком длинная (макс 1000 символов)." });
  }

  return errors;
}