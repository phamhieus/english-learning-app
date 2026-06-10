// Derived progress state. All cross-feature reads go through these selectors so
// the heavy work (streak, averages, estimates) is computed once and memoized.

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import type { PracticeSession } from '../types/learningProgress.types';
import { computeStreak } from '../utils/progressCalculations';

export const selectAllSessions = (state: RootState): PracticeSession[] =>
  state.progress.sessions;

export const selectProgressStatus = (state: RootState) => state.progress.status;

/** True until the first load completes (or fails). */
export const selectProgressLoading = (state: RootState): boolean =>
  state.progress.status === 'idle' || state.progress.status === 'loading';

function scoredValues(sessions: PracticeSession[]): number[] {
  return sessions
    .map((s) => s.score)
    .filter((v): v is number => typeof v === 'number' && v > 0);
}

function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Dashboard / sidebar stats. Memoized — recomputes only when sessions change. */
export const selectUserStats = createSelector([selectAllSessions], (sessions) => {
  const streak = computeStreak(sessions).current;
  const totalSessions = sessions.length;

  const allScores = scoredValues(sessions);
  const avgScore = allScores.length ? Math.round(average(allScores)) : 0;

  // TOEIC speaking/writing scores: normalized 0–100 → rough 10–200 estimate.
  const toeicScores = scoredValues(sessions.filter((s) => s.program === 'TOEIC'));
  const toeicEst = toeicScores.length ? Math.round(average(toeicScores) * 1.9 + 10) : null;

  // IELTS scores: avg 0–100 → 0–9 band (rounded to the nearest half).
  const ieltsScores = scoredValues(sessions.filter((s) => s.program === 'IELTS'));
  const ieltsEst = ieltsScores.length ? Math.round((average(ieltsScores) / 100) * 9 * 2) / 2 : null;

  return { streak, totalSessions, avgScore, toeicEst, ieltsEst };
});
