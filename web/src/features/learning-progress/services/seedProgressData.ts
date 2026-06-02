// One-time seeding of demo practice history into the local repository.
//
// We seed only when the store is empty AND we haven't seeded before (tracked via
// a localStorage flag) so a user who legitimately clears their history isn't
// re-flooded with mock data on the next visit.

import { generateMockSessions } from '../data/mockSessions';
import { practiceSessionRepository } from './storage/practiceSessionRepository';

const SEED_FLAG_KEY = 'learning_progress_seeded_v1';

export async function ensureSeedData(): Promise<void> {
  if (localStorage.getItem(SEED_FLAG_KEY) === 'true') return;

  const existing = await practiceSessionRepository.count();
  if (existing === 0) {
    await practiceSessionRepository.saveMany(generateMockSessions());
  }
  localStorage.setItem(SEED_FLAG_KEY, 'true');
}
