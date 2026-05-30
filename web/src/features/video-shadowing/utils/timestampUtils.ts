// Pure timestamp helpers. All durations are integer milliseconds internally.

/** Parse an SRT timestamp "HH:MM:SS,mmm" (or VTT "HH:MM:SS.mmm") to ms. */
export function parseCueTimestamp(raw: string): number | null {
  const m = raw.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})$/);
  if (!m) return null;
  const [, hh, mm, ss, ms] = m;
  const hours = hh ? parseInt(hh, 10) : 0;
  const minutes = parseInt(mm, 10);
  const seconds = parseInt(ss, 10);
  const millis = parseInt(ms.padEnd(3, '0'), 10);
  if (minutes > 59 || seconds > 59) return null;
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;
}

/** "m:ss" for compact UI display (e.g. video durations, segment chips). */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "0:00 – 0:04" range label used in the segment editor. */
export function formatRange(startMs: number, endMs: number): string {
  return `${formatClock(startMs)} – ${formatClock(endMs)}`;
}

/** Serialize ms back to an SRT timestamp "HH:MM:SS,mmm". */
export function toSrtTimestamp(ms: number): string {
  const safe = Math.max(0, Math.round(ms));
  const h = Math.floor(safe / 3_600_000);
  const m = Math.floor((safe % 3_600_000) / 60_000);
  const s = Math.floor((safe % 60_000) / 1000);
  const millis = safe % 1000;
  const p = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${p(h)}:${p(m)}:${p(s)},${p(millis, 3)}`;
}

export function clampTimeRange(startMs: number, endMs: number, durationMs?: number): { startMs: number; endMs: number } {
  let s = Math.max(0, Math.round(startMs));
  let e = Math.max(s + 1, Math.round(endMs));
  if (durationMs != null) {
    e = Math.min(e, durationMs);
    s = Math.min(s, e - 1);
  }
  return { startMs: s, endMs: e };
}
