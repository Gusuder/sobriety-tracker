import { toDateKey } from "./date";

export function monthBounds(date: Date): { fromKey: string; toKey: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0);
  return { fromKey: toDateKey(from), toKey: toDateKey(to) };
}

export function daysInMonthGrid(date: Date) {
  // Понедельник = 0..6 (удобно для РФ)
  const y = date.getFullYear();
  const m = date.getMonth();

  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);

  const firstDow = (first.getDay() + 6) % 7; // 0=пн ... 6=вс
  const totalDays = last.getDate();

  const cells: { date: Date; inMonth: boolean; dateKey: string }[] = [];

  // сколько дней взять из прошлого месяца
  for (let i = 0; i < firstDow; i++) {
    const d = new Date(y, m, 1);
    d.setDate(d.getDate() - (firstDow - i));
    cells.push({ date: d, inMonth: false, dateKey: toDateKey(d) });
  }

  // дни текущего месяца
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(y, m, day);
    cells.push({ date: d, inMonth: true, dateKey: toDateKey(d) });
  }

  // добиваем до 6 недель (42 клетки)
  while (cells.length < 42) {
    const lastCell = cells[cells.length - 1].date;
    const d = new Date(lastCell);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, inMonth: false, dateKey: toDateKey(d) });
  }

  return cells;
}

export function monthTitle(date: Date): string {
  return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}