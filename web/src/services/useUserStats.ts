import { useEffect, useMemo, useState } from 'react';
import type { PracticeSession } from '../features/learning-progress/types/learningProgress.types';
import { practiceSessionRepository } from '../features/learning-progress/services/storage/practiceSessionRepository';
import { ensureSeedData } from '../features/learning-progress/services/seedProgressData';
import { computeStreak } from '../features/learning-progress/utils/progressCalculations';

export interface UserStats {
  streak: number;           // consecutive practice days (global)
  totalSessions: number;
  avgScore: number;         // 0–100 overall avg
  toeicEst: number | null;  // estimated TOEIC score or null if no data
  ieltsEst: number | null;  // estimated IELTS band or null if no data
  loading: boolean;
}

function scoredValues(sessions: PracticeSession[]): number[] {
  return sessions
    .map((s) => s.score)
    .filter((v): v is number => typeof v === 'number' && v > 0);
}

function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Dashboard / sidebar stats, sourced from the SAME data as the Learning Progress
 * screen (completed practice sessions in the local repository) so the two views
 * never disagree. Seeds demo data on first run so a new user still sees numbers.
 */
export function useUserStats(): UserStats {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureSeedData();
      const all = await practiceSessionRepository.getAll();
      if (!cancelled) {
        setSessions(all);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
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

    return { streak, totalSessions, avgScore, toeicEst, ieltsEst, loading };
  }, [sessions, loading]);
}
