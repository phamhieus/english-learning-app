// The single source of truth for completed practice sessions across the app.
//
// State holds RAW sessions only — never derived values (streak, averages, ...).
// Everything derived is computed in progressSelectors via memoized selectors, so
// the store can never disagree with itself.

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { PracticeSession } from '../types/learningProgress.types';
import { loadSessions, saveSession } from './progressThunks';

export type ProgressStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ProgressState {
  sessions: PracticeSession[];
  status: ProgressStatus;
}

const initialState: ProgressState = {
  sessions: [],
  status: 'idle',
};

/** Upsert by id — mirrors the repository's put semantics. */
function upsert(sessions: PracticeSession[], session: PracticeSession): PracticeSession[] {
  const i = sessions.findIndex((s) => s.id === session.id);
  if (i === -1) return [...sessions, session];
  const next = sessions.slice();
  next[i] = session;
  return next;
}

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    /** Discard in-memory state (e.g. after the user clears their history). */
    resetProgress(state) {
      state.sessions = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSessions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadSessions.fulfilled, (state, action: PayloadAction<PracticeSession[]>) => {
        state.sessions = action.payload;
        state.status = 'ready';
      })
      .addCase(loadSessions.rejected, (state) => {
        state.status = 'error';
      })
      .addCase(saveSession.fulfilled, (state, action: PayloadAction<PracticeSession>) => {
        state.sessions = upsert(state.sessions, action.payload);
      });
  },
});

export const { resetProgress } = progressSlice.actions;
export const progressReducer = progressSlice.reducer;
