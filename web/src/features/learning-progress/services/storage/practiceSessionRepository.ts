// Repository abstraction over practice-session persistence.
//
// The page/hooks depend on the PracticeSessionRepository INTERFACE, never on
// IndexedDB directly. That keeps the door open for a future cloud-sync backend:
// implement the same interface (e.g. CloudPracticeSessionRepository) and swap
// the exported `practiceSessionRepository` singleton — no UI changes required.

import type { PracticeSession } from '../../types/learningProgress.types';
import {
  STORES,
  idbClear,
  idbCount,
  idbDelete,
  idbGet,
  idbGetAll,
  idbPut,
} from './progressDb';

export interface PracticeSessionRepository {
  /** All completed sessions, unsorted. */
  getAll(): Promise<PracticeSession[]>;
  getById(id: string): Promise<PracticeSession | undefined>;
  /** Persist one completed session (upsert by id). */
  save(session: PracticeSession): Promise<PracticeSession>;
  /** Bulk upsert — used by seeding and (future) sync. */
  saveMany(sessions: PracticeSession[]): Promise<void>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
  clear(): Promise<void>;
}

class IndexedDbPracticeSessionRepository implements PracticeSessionRepository {
  getAll(): Promise<PracticeSession[]> {
    return idbGetAll<PracticeSession>(STORES.practiceSessions);
  }

  getById(id: string): Promise<PracticeSession | undefined> {
    return idbGet<PracticeSession>(STORES.practiceSessions, id);
  }

  save(session: PracticeSession): Promise<PracticeSession> {
    return idbPut(STORES.practiceSessions, session);
  }

  async saveMany(sessions: PracticeSession[]): Promise<void> {
    await Promise.all(sessions.map((s) => idbPut(STORES.practiceSessions, s)));
  }

  delete(id: string): Promise<void> {
    return idbDelete(STORES.practiceSessions, id);
  }

  count(): Promise<number> {
    return idbCount(STORES.practiceSessions);
  }

  clear(): Promise<void> {
    return idbClear(STORES.practiceSessions);
  }
}

/** Active repository implementation. Swap here to add cloud sync later. */
export const practiceSessionRepository: PracticeSessionRepository =
  new IndexedDbPracticeSessionRepository();
