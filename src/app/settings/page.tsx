"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MotionPage } from "@/components/MotionPage";
import { parseExportBlob } from "@/domain/exportSchema";
import { exportBackup, importBackupAtomic, type ImportMode } from "@/db/backup";
import { metaGet, metaSet } from "@/db/meta";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtDateTime(ts: number) {
  try {
    return new Date(ts).toLocaleString("ru-RU");
  } catch {
    return String(ts);
  }
}

type FileStatus =
  | { kind: "none" }
  | { kind: "ok"; exportedAt: number; days: number; sessions: number }
  | { kind: "bad"; error: string };

type LastImportError = { at: number; message: string; fileName?: string; mode?: ImportMode };

const META_IMPORT_MODE = "settings.importMode";
const META_LAST_IMPORT_ERROR = "settings.lastImportError";

const card = "rounded-2xl border border-[var(--border)] bg-white/80 backdrop-blur p-4 shadow-sm";
const btnPrimary =
  "rounded-xl bg-[var(--accent)] text-white px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50";
const btnSoft =
  "rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm transition active:scale-[0.98]";
const muted = "text-[var(--muted)]";

export default function Page() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState<ImportMode>("merge");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<FileStatus>({ kind: "none" });

  const [lastErr, setLastErr] = useState<LastImportError | null>(null);

  useEffect(() => {
    (async () => {
      const savedMode = await metaGet<ImportMode>(META_IMPORT_MODE);
      if (savedMode === "merge" || savedMode === "replace") setMode(savedMode);

      const savedErr = await metaGet<LastImportError>(META_LAST_IMPORT_ERROR);
      if (savedErr && typeof savedErr === "object" && typeof (savedErr as any).message === "string") setLastErr(savedErr);
    })();
  }, []);

  async function onExport() {
    const payload = await exportBackup();
    downloadJson(`sobriety-export-${new Date().toISOString().slice(0, 10)}.json`, payload);
    setMsg("Экспорт готов ✅");
  }

  async function readAndValidate(file: File): Promise<FileStatus> {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = parseExportBlob(parsed);
      if (!res.ok) return { kind: "bad", error: res.error };
      return {
        kind: "ok",
        exportedAt: res.value.exportedAt,
        days: res.value.dayEntries.length,
        sessions: res.value.crisisSessions.length,
      };
    } catch (e: any) {
      return { kind: "bad", error: e?.message ?? "неизвестная ошибка" };
    }
  }

  async function onPickFile(file: File) {
    setMsg("");
    setSelectedFile(file);
    setStatus({ kind: "none" });
    setStatus(await readAndValidate(file));
  }

  async function onCheckFile() {
    setMsg("");
    if (!selectedFile) {
      setMsg("Выбери файл, чтобы проверить.");
      return;
    }
    const st = await readAndValidate(selectedFile);
    setStatus(st);

    if (st.kind === "ok") {
      setMsg("Файл корректный ✅");
      return;
    }
    if (st.kind === "bad") {
      setMsg(`Файл некорректный: ${st.error}`);
      return;
    }
    setMsg("Не удалось проверить файл.");
  }

  async function writeLastError(message: string) {
    const payload: LastImportError = { at: Date.now(), message, fileName: selectedFile?.name, mode };
    setLastErr(payload);
    await metaSet(META_LAST_IMPORT_ERROR, payload);
  }

  async function clearLastError() {
    setLastErr(null);
    await metaSet(META_LAST_IMPORT_ERROR, null);
  }

  async function onImport() {
    setMsg("");

    if (!selectedFile) {
      setMsg("Выбери файл для импорта.");
      return;
    }

    if (mode === "replace") {
      const ok = confirm("Режим ЗАМЕНА удалит текущие записи и загрузит данные из файла. Продолжить?");
      if (!ok) return;
    }

    const st = await readAndValidate(selectedFile);
    setStatus(st);
    if (st.kind === "bad") {
      const m = `Ошибка импорта: ${st.error}`;
      setMsg(m);
      await writeLastError(m);
      return;
    }

    try {
      setMsg("Импорт...");

      const text = await selectedFile.text();
      const parsed = JSON.parse(text);
      const res = parseExportBlob(parsed);
      if (!res.ok) {
        const m = `Ошибка импорта: ${res.error}`;
        setMsg(m);
        await writeLastError(m);
        return;
      }

      await importBackupAtomic(res.value, mode);

      await clearLastError();
      setMsg(mode === "replace" ? "Импорт (замена) завершён ✅" : "Импорт (слияние) завершён ✅");
      router.push("/");
    } catch (e: any) {
      const m = `Ошибка импорта: ${e?.message ?? "неизвестная ошибка"}`;
      setMsg(m);
      await writeLastError(m);
    }
  }

  function resetFile() {
    setSelectedFile(null);
    setStatus({ kind: "none" });
    setMsg("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const msgClass = msg.startsWith("Ошибка") || msg.startsWith("Файл некорректный") ? "text-[#B4534E]" : "";

  return (
    <MotionPage>
      <main className="mx-auto max-w-md p-4 space-y-4">
        <header>
          <h1 className="text-xl font-bold">Настройки</h1>
          <div className={`text-sm ${muted}`}>Локальное хранение · Экспорт/импорт</div>
        </header>

        <section className={card}>
          <div className="font-semibold">Экспорт</div>
          <button className={`mt-3 w-full ${btnPrimary}`} onClick={onExport}>
            Скачать JSON-бэкап
          </button>
          <div className={`mt-2 text-xs ${muted}`}>Сохраняет все записи и кризисные сессии в файл.</div>
        </section>

        <section className={card}>
          <div className="font-semibold">Импорт</div>

          <label className="block text-sm mt-3">
            <span className={muted}>Режим импорта</span>
            <select
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2"
              value={mode}
              onChange={(e) => {
                const v = e.target.value as ImportMode;
                setMode(v);
                metaSet(META_IMPORT_MODE, v);
              }}
            >
              <option value="merge">Слияние (merge) — добавить/обновить</option>
              <option value="replace">Замена (replace) — очистить и загрузить</option>
            </select>
          </label>

          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f);
            }}
          />

          <button className={`mt-3 w-full ${btnSoft}`} onClick={() => fileRef.current?.click()}>
            Выбрать файл
          </button>

          {selectedFile ? (
            <div className="mt-3 rounded-xl bg-white/70 border border-[var(--border)] p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{selectedFile.name}</div>
                <button className="text-xs underline" onClick={resetFile}>
                  сбросить
                </button>
              </div>

              {status.kind === "ok" ? (
                <div className={`mt-1 text-xs ${muted}`}>
                  Экспорт: {fmtDateTime(status.exportedAt)} · Дней: {status.days} · Сессий: {status.sessions}
                </div>
              ) : status.kind === "bad" ? (
                <div className="mt-1 text-xs text-[#B4534E]">Ошибка: {status.error}</div>
              ) : (
                <div className={`mt-1 text-xs ${muted}`}>Файл выбран. Можно проверить или импортировать.</div>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button className={btnSoft} onClick={onCheckFile}>
              Проверить
            </button>
            <button className={btnPrimary} onClick={onImport} disabled={!selectedFile || status.kind === "bad"}>
              Импортировать
            </button>
          </div>

          <div className={`mt-2 text-xs ${muted}`}>
            Импорт одной транзакцией. Для режима “замена” будет подтверждение.
          </div>
        </section>

        {lastErr ? (
          <section className={card}>
            <div className="font-semibold">Последняя ошибка импорта</div>
            <div className={`mt-1 text-xs ${muted}`}>
              {fmtDateTime(lastErr.at)}
              {lastErr.mode ? ` · mode: ${lastErr.mode}` : ""}
              {lastErr.fileName ? ` · file: ${lastErr.fileName}` : ""}
            </div>
            <div className="mt-2 text-sm text-[#B4534E]">{lastErr.message}</div>
            <button className={`mt-3 w-full ${btnSoft}`} onClick={clearLastError}>
              Очистить
            </button>
          </section>
        ) : null}

        {msg ? <div className={`text-sm ${msgClass}`}>{msg}</div> : null}
      </main>
    </MotionPage>
  );
}