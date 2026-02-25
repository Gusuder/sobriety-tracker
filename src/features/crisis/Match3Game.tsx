"use client";

import { useEffect, useMemo, useState } from "react";

type TileType = "A" | "B" | "C" | "D" | "E";
type Tile = { id: string; type: TileType };
type Empty = { kind: "empty" };
type Cell = Tile | Empty;

type Pos = { r: number; c: number };

const TYPES: TileType[] = ["A", "B", "C", "D", "E"];
const SIZE = 6;
const ROUND_SECONDS = 60;
const EMPTY: Empty = { kind: "empty" };

function randType(): TileType {
  return TYPES[Math.floor(Math.random() * TYPES.length)];
}

function makeId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function cloneGrid(g: Tile[][]): Tile[][] {
  return g.map((row) => row.map((t) => ({ ...t })));
}

function inBounds(p: Pos) {
  return p.r >= 0 && p.r < SIZE && p.c >= 0 && p.c < SIZE;
}

function neighbors(p: Pos): Pos[] {
  return [
    { r: p.r - 1, c: p.c },
    { r: p.r + 1, c: p.c },
    { r: p.r, c: p.c - 1 },
    { r: p.r, c: p.c + 1 },
  ].filter(inBounds);
}

function swap(g: Tile[][], a: Pos, b: Pos): Tile[][] {
  const ng = cloneGrid(g);
  const tmp = ng[a.r][a.c];
  ng[a.r][a.c] = ng[b.r][b.c];
  ng[b.r][b.c] = tmp;
  return ng;
}

function findMatches(g: Tile[][]): Pos[] {
  const matched = new Set<string>();

  for (let r = 0; r < SIZE; r++) {
    let runStart = 0;
    for (let c = 1; c <= SIZE; c++) {
      const cur = c < SIZE ? g[r][c].type : null;
      const prev = g[r][c - 1].type;
      const runLen = c - runStart;

      if (cur !== prev) {
        if (runLen >= 3) for (let k = runStart; k < c; k++) matched.add(`${r},${k}`);
        runStart = c;
      }
    }
  }

  for (let c = 0; c < SIZE; c++) {
    let runStart = 0;
    for (let r = 1; r <= SIZE; r++) {
      const cur = r < SIZE ? g[r][c].type : null;
      const prev = g[r - 1][c].type;
      const runLen = r - runStart;

      if (cur !== prev) {
        if (runLen >= 3) for (let k = runStart; k < r; k++) matched.add(`${k},${c}`);
        runStart = r;
      }
    }
  }

  return Array.from(matched).map((s) => {
    const [r, c] = s.split(",").map(Number);
    return { r, c };
  });
}

function clearMatches(g: Tile[][], matches: Pos[]): Cell[][] {
  const ng: Cell[][] = g.map((row) => row.map((t) => ({ ...t })));
  for (const p of matches) ng[p.r][p.c] = EMPTY;
  return ng;
}

function collapse(g: Cell[][]): Tile[][] {
  const ng: Tile[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ id: makeId(), type: "A" as TileType }))
  );

  for (let c = 0; c < SIZE; c++) {
    const col: Tile[] = [];
    for (let r = SIZE - 1; r >= 0; r--) {
      const cell = g[r][c];
      if ("kind" in cell) continue;
      col.push(cell);
    }
    while (col.length < SIZE) col.push({ id: makeId(), type: randType() });

    for (let r = SIZE - 1; r >= 0; r--) {
      ng[r][c] = col[SIZE - 1 - r];
    }
  }
  return ng;
}

function resolve(g: Tile[][]): { grid: Tile[][]; cleared: number } {
  let grid = g;
  let cleared = 0;

  while (true) {
    const matches = findMatches(grid);
    if (matches.length === 0) break;

    cleared += matches.length;
    const clearedGrid = clearMatches(grid, matches);
    grid = collapse(clearedGrid);
  }

  return { grid, cleared };
}

function hasAnyValidMove(g: Tile[][]): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const p = { r, c };
      for (const n of neighbors(p)) {
        const swapped = swap(g, p, n);
        if (findMatches(swapped).length > 0) return true;
      }
    }
  }
  return false;
}

function shuffleUntilMove(g: Tile[][]): Tile[][] {
  let grid = cloneGrid(g);
  let guard = 0;

  while (!hasAnyValidMove(grid) && guard < 30) {
    const types: TileType[] = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) types.push(grid[r][c].type);

    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    let idx = 0;
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) grid[r][c].type = types[idx++];

    guard += 1;
  }

  return grid;
}

function makeGridRaw(): Tile[][] {
  const g: Tile[][] = [];
  for (let r = 0; r < SIZE; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < SIZE; c++) row.push({ id: makeId(), type: randType() });
    g.push(row);
  }
  return g;
}

function makeGrid(): Tile[][] {
  let grid = makeGridRaw();
  let guard = 0;

  while (findMatches(grid).length > 0 && guard < 30) {
    grid = makeGridRaw();
    guard += 1;
  }

  if (!hasAnyValidMove(grid)) grid = shuffleUntilMove(grid);
  return grid;
}

function tileEmoji(t: TileType) {
  if (t === "A") return "●";
  if (t === "B") return "■";
  if (t === "C") return "▲";
  if (t === "D") return "◆";
  return "✦";
}

export function Match3Game({ onUsed }: { onUsed: () => void }) {
  // ВАЖНО: на сервере не генерим случайную сетку -> иначе hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [grid, setGrid] = useState<Tile[][] | null>(null);

  const [selected, setSelected] = useState<Pos | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setMounted(true);
    setGrid(makeGrid());
  }, []);

  useEffect(() => {
    if (!running) return;
    onUsed();

    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    if (timeLeft === 0) setRunning(false);
  }, [timeLeft]);

  function start() {
    if (!mounted) return;
    setMsg("");
    setScore(0);
    setTimeLeft(ROUND_SECONDS);
    setSelected(null);
    setGrid(makeGrid());
    setRunning(true);
  }

  function clickCell(r: number, c: number) {
    if (!running || timeLeft === 0) return;
    if (!grid) return;

    setMsg("");

    const p = { r, c };
    if (!selected) {
      setSelected(p);
      return;
    }

    const isNeighbor = Math.abs(selected.r - p.r) + Math.abs(selected.c - p.c) === 1;
    if (!isNeighbor) {
      setSelected(p);
      return;
    }

    const swapped = swap(grid, selected, p);
    const matches = findMatches(swapped);

    if (matches.length === 0) {
      setMsg("Ход не даёт совпадений.");
      setSelected(null);
      return;
    }

    const { grid: resolved, cleared } = resolve(swapped);
    const next = hasAnyValidMove(resolved) ? resolved : shuffleUntilMove(resolved);

    setGrid(next);
    setScore((s) => s + cleared * 10);
    setSelected(null);
  }

  const title = useMemo(() => {
    if (!running) return "Собери 3 (1 минута)";
    if (timeLeft === 0) return "Раунд завершён";
    return "Собери 3";
  }, [running, timeLeft]);

  return (
    <section className="rounded border p-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        {!running ? (
          <button
            className="rounded bg-black text-white px-3 py-1 text-sm disabled:opacity-50"
            onClick={start}
            disabled={!mounted}
          >
            Играть
          </button>
        ) : (
          <div className="text-sm text-gray-700">
            {timeLeft}s · {score}
          </div>
        )}
      </div>

      {!mounted || !grid ? (
        <div className="mt-3 rounded bg-gray-100 p-3 text-sm text-gray-600">Загрузка игры…</div>
      ) : (
        <div className="mt-3 grid grid-cols-6 gap-1">
          {grid.map((row, r) =>
            row.map((t, c) => {
              const isSel = selected?.r === r && selected?.c === c;
              return (
                <button
                  key={t.id}
                  onClick={() => clickCell(r, c)}
                  className={`h-12 rounded border flex items-center justify-center text-xl ${
                    isSel ? "bg-black text-white border-black" : "bg-white"
                  }`}
                >
                  {tileEmoji(t.type)}
                </button>
              );
            })
          )}
        </div>
      )}

      {msg ? <div className="mt-2 text-xs text-gray-500">{msg}</div> : null}

      <div className="mt-2 text-xs text-gray-500">
        Правило: можно менять только соседние, если получается совпадение.
      </div>
    </section>
  );
}