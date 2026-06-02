// Date helpers — ALL calculations use the user's LOCAL timezone. We never key
// days off UTC, otherwise sessions near midnight would land on the wrong day and
// streaks would break across timezones.

/** YYYY-MM-DD using local date components (not UTC). */
export function toLocalDateKey(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local date key for "today". */
export function todayKey(): string {
  return toLocalDateKey(new Date());
}

/** Parse a YYYY-MM-DD key back into a local Date at midnight. */
export function dateKeyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Add (or subtract) whole days to a date key, returning a new key. */
export function addDaysToKey(key: string, delta: number): string {
  const d = dateKeyToDate(key);
  d.setDate(d.getDate() + delta);
  return toLocalDateKey(d);
}

/** Difference in whole calendar days between two keys (a - b). */
export function dayDiff(aKey: string, bKey: string): number {
  const a = dateKeyToDate(aKey).getTime();
  const b = dateKeyToDate(bKey).getTime();
  return Math.round((a - b) / 86_400_000);
}

/**
 * The most recent N local date keys, oldest → newest, ending today.
 * e.g. last7Days() => [..., yesterday, today].
 */
export function recentDayKeys(count: number): string[] {
  const today = todayKey();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(addDaysToKey(today, -i));
  }
  return keys;
}

/** Short label for a chart axis tick, e.g. "Mon 2". */
export function shortDayLabel(key: string): string {
  const d = dateKeyToDate(key);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
}

/** Compact numeric label for the 30-day view, e.g. "6/2". */
export function compactDayLabel(key: string): string {
  const d = dateKeyToDate(key);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** Friendly full date, e.g. "Monday, June 2, 2026". */
export function fullDateLabel(key: string): string {
  const d = dateKeyToDate(key);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Local clock time for a session, e.g. "9:42 AM". */
export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Human duration from milliseconds, e.g. "0m", "12m", "1h 05m". */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** Whole-minute value (used for chart axes / data points). */
export function msToMinutes(ms: number): number {
  return Math.round(ms / 60_000);
}

// ── Calendar-grid helpers ─────────────────────────────────────────────────

export interface CalendarCell {
  /** YYYY-MM-DD, or null for leading/trailing padding cells. */
  key: string | null;
  dayOfMonth: number | null;
  inCurrentMonth: boolean;
}

/**
 * Build a 6-row × 7-col calendar grid for a month. Weeks start on Sunday.
 * Padding cells (other months) are returned as `inCurrentMonth: false`.
 */
export function buildCalendarGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: CalendarCell[] = [];
  // Leading padding from the previous month.
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ key: null, dayOfMonth: null, inCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      key: toLocalDateKey(new Date(year, month, d)),
      dayOfMonth: d,
      inCurrentMonth: true,
    });
  }
  // Trailing padding so the grid is a whole number of weeks.
  while (cells.length % 7 !== 0) {
    cells.push({ key: null, dayOfMonth: null, inCurrentMonth: false });
  }
  return cells;
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}
