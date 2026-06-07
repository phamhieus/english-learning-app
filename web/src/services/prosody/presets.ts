// Tunable configuration for the prosody engine, kept separate from logic so the
// numbers can be adjusted after listening tests without touching the planner.
//
// Values are starting points (per the spec) and engine-neutral:
//   rate   — speed multiplier, 1 = normal
//   pitch  — semitone offset from the voice default
//   energy — relative loudness hint, mapped to a 0..1 volume by the planner

import type {
  BreakStrength,
  EmotionDegree,
  EmotionStyle,
  SpeechContext,
  TonePreset,
} from './types';

export interface EmotionPreset {
  rate: number;
  pitch: number;
  energy: number;
}

// §9.3 — base expressive presets. `rate` here is a *reference* full-strength
// value; the planner scales its effect by the emotion degree.
export const EMOTION_PRESETS: Record<EmotionStyle, EmotionPreset> = {
  neutral: { rate: 1.0, pitch: 0, energy: 0 },
  friendly: { rate: 1.02, pitch: 1, energy: 1 },
  warm: { rate: 0.98, pitch: 1, energy: 0 },
  cheerful: { rate: 1.05, pitch: 2, energy: 2 },
  excited: { rate: 1.08, pitch: 3, energy: 3 },
  calm: { rate: 0.95, pitch: -1, energy: -1 },
  serious: { rate: 0.96, pitch: -1, energy: 1 },
  empathetic: { rate: 0.94, pitch: -1, energy: -1 },
  concerned: { rate: 0.96, pitch: -1, energy: 0 },
  surprised: { rate: 1.04, pitch: 3, energy: 2 },
  confident: { rate: 1.0, pitch: 0, energy: 2 },
  encouraging: { rate: 1.03, pitch: 1, energy: 2 },
  disappointed: { rate: 0.92, pitch: -2, energy: -1 },
  polite: { rate: 0.98, pitch: 1, energy: 0 },
};

export interface TonePresetConfig {
  rate: number;
  pitch: number;
  emotion: EmotionStyle;
  emotionDegree: EmotionDegree;
  pauseMode: 'clear' | 'natural' | 'expressive';
  preserveRhythm?: boolean;
  // Which emphasis rules this tone wants emphasised more aggressively.
  emphasizeNumbers?: boolean;
  emphasizeNames?: boolean;
  emphasizeContentWords?: boolean;
}

// §10 — content-type tone presets.
export const TONE_PRESETS: Record<TonePreset, TonePresetConfig> = {
  'clear-instruction': {
    rate: 0.98,
    pitch: 0,
    emotion: 'neutral',
    emotionDegree: 0.25,
    pauseMode: 'clear',
    emphasizeNumbers: true,
  },
  'natural-conversation': {
    rate: 1.02,
    pitch: 0,
    emotion: 'friendly',
    emotionDegree: 0.25,
    pauseMode: 'natural',
    emphasizeContentWords: true,
  },
  'shadowing-standard': {
    rate: 1.0,
    pitch: 0,
    emotion: 'neutral',
    emotionDegree: 0.25,
    pauseMode: 'natural',
    preserveRhythm: true,
    emphasizeContentWords: true,
  },
  'news-neutral': {
    rate: 1.0,
    pitch: 0,
    emotion: 'neutral',
    emotionDegree: 0,
    pauseMode: 'clear',
    emphasizeNames: true,
    emphasizeNumbers: true,
  },
  'storytelling-light': {
    rate: 0.98,
    pitch: 0,
    emotion: 'warm',
    emotionDegree: 0.5,
    pauseMode: 'expressive',
    emphasizeContentWords: true,
  },
  'question-friendly': {
    rate: 1.0,
    pitch: 0,
    emotion: 'friendly',
    emotionDegree: 0.25,
    pauseMode: 'natural',
  },
  'announcement-formal': {
    rate: 0.97,
    pitch: 0,
    emotion: 'serious',
    emotionDegree: 0.25,
    pauseMode: 'clear',
    emphasizeNumbers: true,
    emphasizeNames: true,
  },
};

// §5 / §10 — default tone for each speech context. Manual `tonePreset` on the
// request overrides this.
export const CONTEXT_TONE_DEFAULT: Record<SpeechContext, TonePreset> = {
  instruction: 'clear-instruction',
  question: 'question-friendly',
  dialogue: 'natural-conversation',
  shadowing: 'shadowing-standard',
  narration: 'news-neutral',
  'sample-answer': 'natural-conversation',
  news: 'news-neutral',
  storytelling: 'storytelling-light',
  announcement: 'announcement-formal',
};

// §8.2 — default break strength per punctuation / structural boundary.
export const PUNCTUATION_BREAKS: Record<string, BreakStrength> = {
  ',': 'weak',
  '.': 'medium',
  ';': 'medium',
  ':': 'medium',
  '?': 'medium',
  '!': 'medium',
  '—': 'weak',
};

export const PARAGRAPH_BREAK: BreakStrength = 'x-strong';
export const LINE_BREAK: BreakStrength = 'strong';

// §9.2 — shadowing must stay easy to imitate, so cap its expressiveness.
export const SHADOWING_MAX_EMOTION_DEGREE: EmotionDegree = 0.25;

// Phrases that must never be split by a break (§8.4). Matched case-insensitively
// as whole phrases; extend as new fixed expressions appear in lessons.
export const PROTECTED_PHRASES: readonly string[] = [
  'New York City',
  'twenty-five percent',
  "at nine o'clock",
  'as soon as possible',
  'a.m.',
  'p.m.',
];
