import type { ShadowingLesson } from '../features/shadowing/types/shadowing.types';
import lessonsRaw from '../assets/shadowing-lessons.json';

export type ShadowingMode = 'sentence' | 'paragraph' | 'dialogue';

const lessons = lessonsRaw as Record<ShadowingMode, ShadowingLesson[]>;

export function getLessonsByMode(mode: ShadowingMode): ShadowingLesson[] {
  return lessons[mode] ?? [];
}

export function getLessonProgress(lessonId: string): number {
  const raw = localStorage.getItem(`shadowing_progress_${lessonId}`);
  if (!raw) return 0;
  const { completedSegments, totalSegments } = JSON.parse(raw) as {
    completedSegments: number;
    totalSegments: number;
  };
  if (!totalSegments) return 0;
  return Math.round((completedSegments / totalSegments) * 100);
}

export function saveLessonProgress(lessonId: string, completedSegments: number, totalSegments: number) {
  localStorage.setItem(
    `shadowing_progress_${lessonId}`,
    JSON.stringify({ completedSegments, totalSegments })
  );
}

const RECENT_FREE_KEY = 'shadowing_recent_free';
const RECENT_FREE_LIMIT = 3;

/** The 3 most recent free-style shadowing sets the user generated, newest first. */
export function getRecentFreeLessons(): ShadowingLesson[] {
  try {
    const raw = localStorage.getItem(RECENT_FREE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShadowingLesson[];
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_FREE_LIMIT) : [];
  } catch {
    return [];
  }
}

/** Persist a generated free-style lesson, keeping only the newest few. Returns the updated list. */
export function saveRecentFreeLesson(lesson: ShadowingLesson): ShadowingLesson[] {
  const existing = getRecentFreeLessons().filter((l) => l.id !== lesson.id);
  const next = [lesson, ...existing].slice(0, RECENT_FREE_LIMIT);
  localStorage.setItem(RECENT_FREE_KEY, JSON.stringify(next));
  return next;
}
