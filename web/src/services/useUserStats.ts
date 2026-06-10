import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import {
  loadSessions,
  selectProgressLoading,
  selectUserStats,
} from '../features/learning-progress/store';

export interface UserStats {
  streak: number;           // consecutive practice days (global)
  totalSessions: number;
  avgScore: number;         // 0–100 overall avg
  toeicEst: number | null;  // estimated TOEIC score or null if no data
  ieltsEst: number | null;  // estimated IELTS band or null if no data
  loading: boolean;
}

/**
 * Dashboard / sidebar stats, sourced from the shared progress store — the SAME
 * data as the Learning Progress screen — so the views never disagree and update
 * instantly when a session is saved. Seeding + loading is idempotent: every
 * caller can dispatch loadSessions() on mount; the thunk skips refetch once
 * loaded (see progressThunks `condition`).
 */
export function useUserStats(): UserStats {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectUserStats);
  const loading = useAppSelector(selectProgressLoading);

  useEffect(() => {
    void dispatch(loadSessions());
  }, [dispatch]);

  return { ...stats, loading };
}
