// Mock practice history used to demo the Learning Progress page (and to give
// first-time users something to look at). Sessions are generated RELATIVE to the
// current date so the 7-day / 30-day / calendar views always show recent data.
//
// Coverage intentionally includes: active and inactive days, both IELTS and
// TOEIC, multiple sessions on a single day, sessions with/without scores, and a
// mix of audio metadata + transcripts so every Daily-Detail action appears.

import type { LearningProgram, PracticeSession, PracticeSkill } from '../types/learningProgress.types';

interface MockSpec {
  /** Days ago (0 = today). */
  daysAgo: number;
  /** Local clock hour the session started. */
  hour: number;
  minute?: number;
  program: LearningProgram;
  skill: PracticeSkill;
  title: string;
  /** Minutes of active practice. */
  minutes: number;
  score?: number;
  hasAudio?: boolean;
  hasTranscript?: boolean;
}

// Hand-authored spread of activity. Notice gaps (e.g. no daysAgo 3, 6, 9…)
// so inactive days and a realistic streak appear.
const SPECS: MockSpec[] = [
  // ── This week (keeps the current streak alive) ──────────────────────────
  { daysAgo: 0, hour: 8, minute: 15, program: 'IELTS', skill: 'Speaking', title: 'IELTS Part 2 — Describe a place', minutes: 12, score: 78, hasAudio: true, hasTranscript: true },
  { daysAgo: 0, hour: 20, minute: 5, program: 'TOEIC', skill: 'Listening', title: 'TOEIC Part 3 — Conversations', minutes: 18, score: 85 },
  { daysAgo: 1, hour: 7, minute: 40, program: 'TOEIC', skill: 'Speaking', title: 'TOEIC Q1–2 — Read a text aloud', minutes: 9, score: 72, hasAudio: true, hasTranscript: true },
  { daysAgo: 1, hour: 19, program: 'IELTS', skill: 'Writing', title: 'IELTS Task 2 — Opinion essay', minutes: 28, score: 65 },
  { daysAgo: 2, hour: 9, minute: 30, program: 'IELTS', skill: 'Shadowing', title: 'Shadowing — BBC news clip', minutes: 15, hasAudio: true, hasTranscript: true },
  { daysAgo: 4, hour: 18, minute: 10, program: 'TOEIC', skill: 'Reading', title: 'TOEIC Part 7 — Single passages', minutes: 22, score: 80 },
  { daysAgo: 5, hour: 12, program: 'IELTS', skill: 'Speaking', title: 'IELTS Part 1 — Hometown', minutes: 8, score: 70, hasAudio: true, hasTranscript: true },
  { daysAgo: 5, hour: 21, minute: 15, program: 'TOEIC', skill: 'Writing', title: 'TOEIC — Respond to a written request', minutes: 14, score: 76 },

  // ── Last week ───────────────────────────────────────────────────────────
  { daysAgo: 7, hour: 8, program: 'TOEIC', skill: 'Listening', title: 'TOEIC Part 4 — Short talks', minutes: 20, score: 82 },
  { daysAgo: 8, hour: 17, minute: 45, program: 'IELTS', skill: 'Writing', title: 'IELTS Task 1 — Bar chart', minutes: 25, score: 68 },
  { daysAgo: 8, hour: 22, program: 'IELTS', skill: 'Shadowing', title: 'Shadowing — TED talk excerpt', minutes: 11, hasAudio: true },
  { daysAgo: 10, hour: 7, minute: 20, program: 'TOEIC', skill: 'Speaking', title: 'TOEIC Q11 — Express an opinion', minutes: 10, score: 74, hasAudio: true, hasTranscript: true },
  { daysAgo: 11, hour: 13, program: 'IELTS', skill: 'Speaking', title: 'IELTS Part 3 — Discussion', minutes: 13, score: 75, hasAudio: true, hasTranscript: true },
  { daysAgo: 13, hour: 19, minute: 30, program: 'TOEIC', skill: 'Reading', title: 'TOEIC Part 5 — Incomplete sentences', minutes: 16, score: 88 },

  // ── Earlier this month (feeds 30-day view + longest streak) ─────────────
  { daysAgo: 14, hour: 9, program: 'IELTS', skill: 'Writing', title: 'IELTS Task 2 — Discuss both views', minutes: 30, score: 66 },
  { daysAgo: 15, hour: 8, minute: 30, program: 'IELTS', skill: 'Speaking', title: 'IELTS Part 2 — Describe a person', minutes: 12, score: 71, hasAudio: true, hasTranscript: true },
  { daysAgo: 16, hour: 20, program: 'TOEIC', skill: 'Listening', title: 'TOEIC Part 1 — Photographs', minutes: 14, score: 90 },
  { daysAgo: 17, hour: 18, program: 'TOEIC', skill: 'Reading', title: 'TOEIC Part 6 — Text completion', minutes: 19, score: 79 },
  { daysAgo: 18, hour: 7, minute: 50, program: 'IELTS', skill: 'Shadowing', title: 'Shadowing — Podcast segment', minutes: 17, hasAudio: true, hasTranscript: true },
  { daysAgo: 21, hour: 12, minute: 10, program: 'TOEIC', skill: 'Speaking', title: 'TOEIC Q3–4 — Describe a picture', minutes: 9, score: 73, hasAudio: true, hasTranscript: true },
  { daysAgo: 24, hour: 16, program: 'IELTS', skill: 'Writing', title: 'IELTS Task 1 — Process diagram', minutes: 26, score: 64 },
  { daysAgo: 27, hour: 21, minute: 5, program: 'TOEIC', skill: 'Listening', title: 'TOEIC Part 2 — Question–response', minutes: 13, score: 84 },
  { daysAgo: 29, hour: 10, program: 'IELTS', skill: 'Speaking', title: 'IELTS Part 1 — Daily routine', minutes: 8, score: 69, hasAudio: true, hasTranscript: true },
];

function makeSession(spec: MockSpec, index: number): PracticeSession {
  const started = new Date();
  started.setDate(started.getDate() - spec.daysAgo);
  started.setHours(spec.hour, spec.minute ?? 0, 0, 0);

  const durationMs = spec.minutes * 60_000;
  const completed = new Date(started.getTime() + durationMs);

  return {
    id: `mock-${index}-${spec.daysAgo}-${spec.hour}${spec.minute ?? 0}`,
    program: spec.program,
    skill: spec.skill,
    title: spec.title,
    startedAt: started.toISOString(),
    completedAt: completed.toISOString(),
    durationMs,
    score: spec.score,
    resultRef: `/${spec.skill.toLowerCase()}`,
    retryRef: `/${spec.skill.toLowerCase()}`,
    audio: spec.hasAudio
      ? { fileRef: `local://mock-audio/${index}.webm`, durationMs, mimeType: 'audio/webm' }
      : undefined,
    transcript: spec.hasTranscript
      ? 'This is a saved transcript of the practice session. (Mock transcript content.)'
      : undefined,
  };
}

/** Generate the full set of mock sessions, anchored to the current date. */
export function generateMockSessions(): PracticeSession[] {
  return SPECS.map(makeSession);
}
