"use client";

import { useEffect, useRef, useState } from "react";
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

export default function Page() {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState<ImportMode>("merge");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<FileStatus>({ kind: "none" });

  // загрузить сохранённый режим импорта
  useEffect(() => {
    (async () => {
      const saved = await metaGet<ImportMode>("settings.importMode");
      if (saved === "merge" || saved === "replace") setMode(saved);
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

    const st = await readAndValidate(file);
    setStatus(st);
  }

  async function onCheckFile() {
    setMsg("");
    if (!selectedFile) {
      setMsg("Выбери файл, чтобы проверить.");
      return;
    }
    const st = await readAndValidate(selectedFile);
    setStatus(st);
    if (st.kind === "ok") setMsg("Файл корректный ✅");
    if (st.kind === "bad") setMsg(`Файл некорректный: ${st.error}`);
  }

  async function onImport() {
    setMsg("");
    if (!selectedFile) {
      setMsg("Выбери файл для импорта.");
      return;
    }

    const st = await readAndValidate(selectedFile);
    setStatus(st);
    if (st.kind === "bad") {
      setMsg(`Ошибка импорта: ${st.error}`);
      return;
    }

    try {
      setMsg("Импорт...");

      const text = await selectedFile.text();
      const parsed = JSON.parse(text);
      const res = parseExportBlob(parsed);
      if (!res.ok) {
        setMsg(`Ошибка импорта: ${res.error}`);
        return;
      }

      await importBackupAtomic(res.value, mode);
      setMsg(mode === "replace" ? "Импорт (замена) завершён ✅" : "Импорт (слияние) завершён ✅");
    } catch (e: any) {
      setMsg(`Ошибка импорта: ${e?.message ?? "неизвестная ошибка"}`);
    }
  }

  function resetFile() {
    setSelectedFile(null);
    setStatus({ kind: "none" });
    setMsg("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <main className="mx-auto max-w-md p-4 space-y-3">
      <h1 className="text-xl font-bold">Настройки</h1>

      <section className="rounded border p-3 space-y-2">
        <div className="font-semibold">Экспорт</div>
        <button className="w-full rounded bg-black text-white px-3 py-2" onClick={onExport}>
          Скачать JSON-бэкап
        </button>
        <div className="text-xs text-gray-500">Сохраняет все записи и кризисные сессии в файл.</div>
      </section>

      <section className="rounded border p-3 space-y-2">
        <div className="font-semibold">Импорт</div>

        <label className="block text-sm">
          <span className="text-gray-600">Режим импорта</span>
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={mode}
            onChange={(e) => {
              const v = e.target.value as ImportMode;
              setMode(v);
              metaSet("settings.importMode", v);
            }}
          >
            <option value="merge">Слияние (merge) — добавить/обновить</option>
            <option value="replace">Замена (replace) — очистить и загрузить</option>
          </select>
        </label>

        {/* Скрытый input */}
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

        <button className="w-full rounded bg-gray-200 px-3 py-2 text-sm" onClick={() => fileRef.current?.click()}>
          Выбрать файл
        </button>

        {selectedFile ? (
          <div className="rounded bg-gray-100 p-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{selectedFile.name}</div>
              <button className="text-xs underline" onClick={resetFile}>
                сбросить
              </button>
            </div>

            {status.kind === "ok" ? (
              <div className="mt-1 text-xs text-gray-700">
                Экспорт: {fmtDateTime(status.exportedAt)} · Дней: {status.days} · Сессий: {status.sessions}
              </div>
            ) : status.kind === "bad" ? (
              <div className="mt-1 text-xs text-red-700">Ошибка: {status.error}</div>
            ) : (
              <div className="mt-1 text-xs text-gray-600">Файл выбран. Можно проверить или импортировать.</div>
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <button className="rounded bg-gray-200 px-3 py-2 text-sm" onClick={onCheckFile}>
            Проверить файл
          </button>
          <button
            className="rounded bg-black text-white px-3 py-2 text-sm disabled:opacity-50"
            onClick={onImport}
            disabled={!selectedFile || status.kind === "bad"}
          >
            Импортировать
          </button>
        </div>

        <div className="text-xs text-gray-500">
          Импорт одной транзакцией: либо применится весь файл, либо не применится ничего.
        </div>
      </section>

      {msg ? <div className="text-sm">{msg}</div> : null}
    </main>
  );
}