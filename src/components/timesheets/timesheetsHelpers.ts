import i18n from '@/src/i18n';

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function getAdjacentDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const leading: number[] = [];
  for (let i = offset - 1; i >= 0; i--) {
    leading.push(daysInPrevMonth - i);
  }

  const totalCells = offset + daysInMonth;
  const trailingCount = (7 - (totalCells % 7)) % 7;
  const trailing: number[] = [];
  for (let d = 1; d <= trailingCount; d++) {
    trailing.push(d);
  }

  return { leading, trailing };
}

export function isToday(year: number, month: number, day: number): boolean {
  const t = new Date();
  return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
}

export function isWeekend(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6;
}

export function getWeekRowForDay(cells: (number | null)[], day: number): number {
  const idx = cells.indexOf(day);
  if (idx === -1) return 0;
  return Math.floor(idx / 7);
}
