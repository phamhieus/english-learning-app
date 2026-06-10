// Async logic for the progress domain. Every thunk goes through the repository
// (IndexedDB = persistence source of truth) FIRST, then returns a payload the
// slice uses to update the in-memory store (UI source of truth). Never bypass
// this: writing the store without the repo loses data on reload; writing the
// repo without dispatching leaves the UI stale.

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { PracticeSession } from '../types/learningProgress.types';
import { practiceSessionRepository } from '../services/storage/practiceSessionRepository';
import { ensureSeedData } from '../services/seedProgressData';
import type { RootState } from '../../../app/store';

/** Seed (first run only) then load every completed session into the store. */
export const loadSessions = createAsyncThunk<
  PracticeSession[],
  void,
  { state: RootState }
>(
  'progress/loadSessions',
  async () => {
    await ensureSeedData();
    return practiceSessionRepository.getAll();
  },
  {
    // Skip if a load is already in flight or has completed — every reader can
    // safely dispatch loadSessions() on mount without triggering refetch storms.
    condition: (_arg, { getState }) => getState().progress.status === 'idle',
  },
);

/**
 * Persist a completed session and merge it into the store so Dashboard, Sidebar
 * and the Progress page all update instantly. Features call this when an
 * exercise finishes: `dispatch(saveSession(session))`.
 */
export const saveSession = createAsyncThunk<PracticeSession, PracticeSession>(
  'progress/saveSession',
  async (session) => {
    await practiceSessionRepository.save(session);
    return session;
  },
);
