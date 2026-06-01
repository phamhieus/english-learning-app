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
