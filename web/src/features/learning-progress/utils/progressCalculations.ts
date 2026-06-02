// Pure aggregation logic for the Learning Progress page. No React, no IO — these
// functions take the raw completed sessions and derive everything the UI shows.

import type {
  DailyPracticeSummary,
  FilteredSummary,
  LearningProgram,
  PracticeSession,
  ProgramFilterValue,
  StreakSummary,
} from '../types/learningProgress.types';
import { addDaysToKey, dayDiff, toLocalDateKey, todayKey } from './dateUtils';

/** Apply the program segmented-control filter. "All" keeps everything. */
export function filterByProgram(
  sessions: PracticeSession[],
  program: ProgramFilterValue,
): PracticeSession[] {
  if (program === 'All') return sessions;
  return sessions.filter((s) => s.program === program);
}

function averageOfScores(sessions: PracticeSession[]): number | null {
  const scored = sessions.filter((s) => typeof s.score === 'number');
  if (!scored.length) return null;
  const sum = scored.reduce((acc, s) => acc + (s.score as number), 0);
  return Math.round(sum / scored.length);
}

/** Filter-aware summary cards (total time, completed count, average score). */
export function computeFilteredSummary(sessions: PracticeSession[]): FilteredSummary {
  return {
    totalDurationMs: sessions.reduce((acc, s) => acc + s.durationMs, 0),
    completedSessions: sessions.length,
    averageScore: averageOfScores(sessions),
  };
}

/**
 * Build a per-day summary for a given set of date keys (oldest → newest).
 * Inactive days are included with zeroed values so charts render gaps as 0.
 * Sessions are matched to days by their LOCAL completedAt date.
 */
export function buildDailySummaries(
  sessions: PracticeSession[],
  dayKeys: string[],
): DailyPracticeSummary[] {
  const byDay = new Map<string, PracticeSession[]>();
  for (const s of sessions) {
    const key = toLocalDateKey(s.completedAt);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(s);
    else byDay.set(key, [s]);
  }

  return dayKeys.map((date) => summarizeDay(date, byDay.get(date) ?? []));
}

/** Summarize a single day's sessions into a DailyPracticeSummary. */
export function summarizeDay(date: string, daySessions: PracticeSession[]): DailyPracticeSummary {
  const sorted = [...daySessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  );
  const byProgram = (p: LearningProgram) => sorted.filter((s) => s.program === p);
  const sumDuration = (arr: PracticeSession[]) => arr.reduce((acc, s) => acc + s.durationMs, 0);

  return {
    date,
    sessions: sorted,
    sessionCount: sorted.length,
    totalDurationMs: sumDuration(sorted),
    averageScore: averageOfScores(sorted),
    ieltsCount: byProgram('IELTS').length,
    toeicCount: byProgram('TOEIC').length,
    ieltsDurationMs: sumDuration(byProgram('IELTS')),
    toeicDurationMs: sumDuration(byProgram('TOEIC')),
  };
}

/**
 * The GLOBAL learning streak — computed from ALL completed sessions, ignoring
 * the program filter (both IELTS and TOEIC feed the same streak). Multiple
 * sessions on one day count as a single streak day.
 *
 * The "current" streak counts consecutive active days ending today. It is still
 * considered alive if the last active day was yesterday (today not practiced yet);
 * it only resets to 0 once a full day has been missed.
 *
 * Recomputed defensively from saved sessions every time the page loads.
 */
export function computeStreak(allSessions: PracticeSession[]): StreakSummary {
  if (!allSessions.length) {
    return { current: 0, longest: 0, lastActiveDate: null };
  }

  // Unique active day keys, ascending.
  const activeKeys = [...new Set(allSessions.map((s) => toLocalDateKey(s.completedAt)))].sort();

  // Longest run of consecutive days anywhere in history.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < activeKeys.length; i++) {
    if (dayDiff(activeKeys[i], activeKeys[i - 1]) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }

  const lastActiveDate = activeKeys[activeKeys.length - 1];
  const today = todayKey();
  const gapFromToday = dayDiff(today, lastActiveDate);

  // Current streak is only "alive" if the last activity was today or yesterday.
  let current = 0;
  if (gapFromToday <= 1) {
    const activeSet = new Set(activeKeys);
    let cursor = lastActiveDate;
    while (activeSet.has(cursor)) {
      current += 1;
      cursor = addDaysToKey(cursor, -1);
    }
  }

  return { current, longest, lastActiveDate };
}
