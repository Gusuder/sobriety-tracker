"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DayEntry } from "@/domain/types";
import type { CravingLevel, MoodLevel, TriggerId } from "@/domain/enums";
import { CRAVING_OPTIONS, MOOD_OPTIONS, TRIGGERS } from "@/domain/labels";
import { todayKey } from "@/utils/date";
import { getDayEntry, upsertDayEntry } from "@/db/dayEntries";
import { validateDayEntryDraft } from "@/domain/validation";

function clampNote(s: string) {
  return s.slice(0, 1000);
}

export default function Page() {
  const router = useRouter();
  const params = useSearchParams();
  const dateKey = useMemo(() => params.get("date") ?? todayKey(), [params]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>("");

  const [isSober, setIsSober] = useState<boolean | null>(null);
  const [craving, setCraving] = useState<CravingLevel>("low");
  const [mood, setMood] = useState<MoodLevel>("ok");
  const [triggers, setTriggers] = useState<TriggerId[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    (async () => {
      const e = await getDayEntry(dateKey);
      if (e) {
        setIsSober(e.isSober);
        setCraving(e.craving);
        setMood(e.mood);
        setTriggers(e.triggers);
        setNote(e.note);
      } else {
        setIsSober(null);
        setCraving("low");
        setMood("ok");
        setTriggers([]);
        setNote("");
      }
      setMsg("");
      setLoading(false);
    })();
  }, [dateKey]);

  function toggleTrigger(id: TriggerId) {
    setTriggers((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function onSave() {
    setMsg("");

    const errors = validateDayEntryDraft({ isSober, note });
    if (errors.length) {
      setMsg(errors[0].message);
      return;
    }

    const now = Date.now();
    const prev = await getDayEntry(dateKey);

    const entry: DayEntry = {
      dateKey,
      isSober: isSober as boolean,
      craving,
      mood,
      triggers,
      note: clampNote(note.trim()),
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
    };

    await upsertDayEntry(entry);
    router.push("/");
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-md p-4">
        <h1 className="text-xl font-bold">Чек-ин</h1>
        <p className="text-sm text-gray-500">Загрузка…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-bold">Чек-ин</h1>
      <p className="text-sm text-gray-500">Дата: {dateKey}</p>

      <div className="mt-4 space-y-4">
        <section className="rounded border p-3">
          <h2 className="font-semibold">Сегодня трезвый?</h2>
          <div className="mt-2 flex gap-2">
            <button
              className={`flex-1 rounded px-3 py-2 border ${
                isSober === true ? "bg-black text-white border-black" : "bg-white"
              }`}
              onClick={() => {
                setIsSober(true);
                setMsg("");
              }}
            >
              Да
            </button>
            <button
              className={`flex-1 rounded px-3 py-2 border ${
                isSober === false ? "bg-black text-white border-black" : "bg-white"
              }`}
              onClick={() => {
                setIsSober(false);
                setMsg("");
              }}
            >
              Нет
            </button>
          </div>
        </section>

        <section className="rounded border p-3">
          <h2 className="font-semibold">Тяга</h2>
          <select
            className="mt-2 w-full rounded border px-3 py-2"
            value={craving}
            onChange={(e) => setCraving(e.target.value as CravingLevel)}
          >
            {CRAVING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </section>

        <section className="rounded border p-3">
          <h2 className="font-semibold">Настроение</h2>
          <select
            className="mt-2 w-full rounded border px-3 py-2"
            value={mood}
            onChange={(e) => setMood(e.target.value as MoodLevel)}
          >
            {MOOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </section>

        <section className="rounded border p-3">
          <h2 className="font-semibold">Триггеры</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {TRIGGERS.map((t) => {
              const active = triggers.includes(t.id);
              return (
                <button
                  key={t.id}
                  className={`rounded border px-2 py-2 text-sm text-left ${
                    active ? "bg-black text-white border-black" : "bg-white"
                  }`}
                  onClick={() => toggleTrigger(t.id)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded border p-3">
          <h2 className="font-semibold">Заметка</h2>
          <textarea
            className="mt-2 w-full rounded border px-3 py-2 min-h-[96px]"
            value={note}
            onChange={(e) => setNote(clampNote(e.target.value))}
            placeholder="Коротко: что произошло, что почувствовал, что помогло…"
          />
          <div className="mt-1 text-xs text-gray-500">{note.length}/1000</div>
        </section>

        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}

        <div className="flex gap-2">
          <button
            disabled={isSober === null}
            className="flex-1 rounded bg-black text-white px-3 py-2 disabled:opacity-50"
            onClick={onSave}
          >
            Сохранить
          </button>
          <button className="flex-1 rounded bg-gray-200 px-3 py-2" onClick={() => router.push("/")}>
            Отмена
          </button>
        </div>
      </div>
    </main>
  );
}