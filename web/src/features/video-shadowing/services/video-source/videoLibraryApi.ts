// Local "API" for the Video Shadowing library. Filtering goes through these
// async calls (rather than filtering an in-memory array) so the data flow is
// request/response and can be swapped for a real backend later without touching
// the UI. VOA comes from the curated manifest; "My Videos" from IndexedDB.

import { getBuiltInVoaLessons, getRandomVoaLessons, type BuiltInVoaLesson } from './builtInVoaResolver';
import { lessonRepo } from '../storage/videoShadowingRepository';
import type { VideoShadowingLesson } from '../../models/lesson';

export interface LibraryFilters {
  /** 'All levels' | 'A1' | 'A2' | 'B1' | 'B2' */
  level: string;
  /** 'All' | category name */
  category: string;
  search: string;
}

export const NO_LEVEL = 'All levels';
export const NO_CATEGORY = 'All';

export function isFiltering(f: LibraryFilters): boolean {
  return f.level !== NO_LEVEL || f.category !== NO_CATEGORY || f.search.trim() !== '';
}

// Simulated latency so loading states are exercised; trivially removed/replaced
// when a real endpoint is wired.
const networkDelay = (ms = 140) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function matchesText(haystack: string[], q: string): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  return haystack.some((h) => h.toLowerCase().includes(needle));
}

/** Fetch VOA lessons matching the filters. With no active filter, returns a
 *  fresh random selection; otherwise searches the entire curated pool. */
export async function fetchVoaLessons(filters: LibraryFilters, randomLimit = 10): Promise<BuiltInVoaLesson[]> {
  await networkDelay();
  if (!isFiltering(filters)) return getRandomVoaLessons(randomLimit);

  return getBuiltInVoaLessons().filter(
    (l) =>
      (filters.level === NO_LEVEL || l.level === filters.level) &&
      (filters.category === NO_CATEGORY || l.category === filters.category) &&
      matchesText([l.title, l.topic, l.description ?? ''], filters.search),
  );
}

/** Fetch the user's imported lessons matching the filters. */
export async function fetchMyLessons(filters: LibraryFilters): Promise<VideoShadowingLesson[]> {
  await networkDelay();
  const all = (await lessonRepo.getAll()).filter((l) => l.sourceType !== 'BuiltInVoa');
  return all
    .filter(
      (l) =>
        (filters.level === NO_LEVEL || l.level === filters.level) &&
        matchesText([l.title, l.topic], filters.search),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
