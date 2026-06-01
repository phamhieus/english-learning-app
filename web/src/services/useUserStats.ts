import { useMemo } from 'react';
import { getHistory } from './storage';

export interface UserStats {
  streak: number;           // consecutive practice days
  totalSessions: number;
  avgScore: number;         // 0–100 overall avg
  toeicEst: number | null;  // estimated TOEIC score or null if no data
  ieltsEst: number | null;  // estimated IELTS band or null if no data
}

function computeStreak(): number {
  const history = getHistory();
  if (!history.length) return 0;

  const days = new Set(
    history.map(h => {
      const d = new Date(h.date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  let streak = 0;
  const today = new Date();
  const cursor = new Date(today);

  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (days.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function useUserStats(): UserStats {
  return useMemo(() => {
    const history = getHistory();

    const streak = computeStreak();
    const totalSessions = history.length;

    const scores = history.map(h => h.score).filter(s => typeof s === 'number' && s > 0);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // TOEIC speaking/writing scores: 0–100 → scale to 10–200
    const toeicItems = history.filter(h =>
      h.focus?.toLowerCase().includes('toeic') || h.type?.toLowerCase().includes('toeic')
    );
    const toeicScores = toeicItems.map(h => h.score).filter(s => s > 0);
    const toeicEst = toeicScores.length
      ? Math.round((toeicScores.reduce((a, b) => a + b, 0) / toeicScores.length) * 1.9 + 10)
      : null;

    // IELTS scores: avg 0–100 → map to 0–9 band
    const ieltsItems = history.filter(h =>
      h.focus?.toLowerCase().includes('ielts') || h.type?.toLowerCase().includes('ielts')
    );
    const ieltsScores = ieltsItems.map(h => h.score).filter(s => s > 0);
    const ieltsEst = ieltsScores.length
      ? Math.round((ieltsScores.reduce((a, b) => a + b, 0) / ieltsScores.length) / 100 * 9 * 2) / 2
      : null;

    return { streak, totalSessions, avgScore, toeicEst, ieltsEst };
  }, []);
}
