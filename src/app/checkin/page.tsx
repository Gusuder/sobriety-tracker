"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DayEntry } from "@/domain/types";
import type { CravingLevel, MoodLevel, TriggerId } from "@/domain/enums";
import { CRAVING_OPTIONS, MOOD_OPTIONS, TRIGGERS } from "@/domain/labels";
import { todayKey } from "@/utils/date";
import { getDayEntry, upsertDayEntry } from "@/db/dayEntries";
import { validateDayEntryDraft } from "@/domain/validation";
import { MotionPage } from "@/components/MotionPage";

const card = "rounded-2xl border border-[var(--border)] bg-white/80 backdrop-blur p-4 shadow-sm";
const btnPrimary =
  "rounded-xl bg-[var(--accent)] text-white px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50";
const btnSoft =
  "rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm transition active:scale-[0.98]";
const muted = "text-[var(--muted)]";

function clampNote(s: string) {
  return s.slice(0, 1000);
}

function CheckinInner() {
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
      <MotionPage>
        <main className="mx-auto max-w-md p-4">
          <h1 className="text-xl font-bold">Чек-ин</h1>
          <p className={`text-sm ${muted}`}>Загрузка…</p>
        </main>
      </MotionPage>
    );
  }

  return (
    <MotionPage>
      <main className="mx-auto max-w-md p-4 space-y-4">
        <header className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold">Чек-ин</h1>
          <span className={`text-xs ${muted}`}>{dateKey}</span>
        </header>

        <section className={card}>
          <h2 className="font-semibold">Сегодня трезвый?</h2>
          <div className="mt-3 flex gap-2">
            <button
              className={`flex-1 rounded-xl px-3 py-2 border border-[var(--border)] transition active:scale-[0.98] ${
                isSober === true ? "bg-[var(--accent)] text-white border-transparent" : "bg-white"
              }`}
              onClick={() => {
                setIsSober(true);
                setMsg("");
              }}
            >
              Да
            </button>
            <button
              className={`flex-1 rounded-xl px-3 py-2 border border-[var(--border)] transition active:scale-[0.98] ${
                isSober === false ? "bg-[var(--accent)] text-white border-transparent" : "bg-white"
              }`}
              onClick={() => {
                setIsSober(false);
                setMsg("");
              }}
            >
              Нет
            </button>
          </div>
          <div className={`mt-2 text-xs ${muted}`}>Если был алкоголь — просто отметь факт. Без самоедства.</div>
        </section>

        <section className={card}>
          <h2 className="font-semibold">Тяга</h2>
          <select
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
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

        <section className={card}>
          <h2 className="font-semibold">Настроение</h2>
          <select
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
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

        <section className={card}>
          <h2 className="font-semibold">Триггеры</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {TRIGGERS.map((t) => {
              const active = triggers.includes(t.id);
              return (
                <button
                  key={t.id}
                  className={`rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-left transition active:scale-[0.98] ${
                    active ? "bg-[var(--accent-weak)] border-transparent" : "bg-white"
                  }`}
                  onClick={() => toggleTrigger(t.id)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className={card}>
          <h2 className="font-semibold">Заметка</h2>
          <textarea
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 min-h-[110px]"
            value={note}
            onChange={(e) => setNote(clampNote(e.target.value))}
            placeholder="Коротко: что произошло, что почувствовал, что помогло…"
          />
          <div className={`mt-1 text-xs ${muted}`}>{note.length}/1000</div>
        </section>

        {msg ? <p className="text-sm text-[#B4534E]">{msg}</p> : null}

        <div className="flex gap-2">
          <button disabled={isSober === null} className={`${btnPrimary} flex-1`} onClick={onSave}>
            Сохранить
          </button>
          <button className={`${btnSoft} flex-1`} onClick={() => router.push("/")}>
            Отмена
          </button>
        </div>
      </main>
    </MotionPage>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md p-4">
          <h1 className="text-xl font-bold">Чек-ин</h1>
          <p className="text-sm text-[var(--muted)]">Загрузка…</p>
        </main>
      }
    >
      <CheckinInner />
    </Suspense>
  );
}