// Core type definitions for the rule-based prosody pipeline.
// These are pure data shapes shared across the planner, rules, SSML builder
// and engine adapters — no runtime logic lives here.

// ── Context & sentence classification ──────────────────────────────────────

export type SpeechContext =
  | 'instruction'
  | 'question'
  | 'dialogue'
  | 'shadowing'
  | 'narration'
  | 'sample-answer'
  | 'news'
  | 'storytelling'
  | 'announcement';

export type SentenceType =
  | 'statement'
  | 'yes-no-question'
  | 'wh-question'
  | 'tag-question'
  | 'choice-question'
  | 'exclamation'
  | 'command'
  | 'request'
  | 'list'
  | 'short-response'
  | 'interjection';

// ── Emphasis ───────────────────────────────────────────────────────────────

export type EmphasisLevel = 'none' | 'reduced' | 'moderate' | 'strong';

export interface EmphasisInstruction {
  text: string;
  level: EmphasisLevel;
}

// ── Breaks ─────────────────────────────────────────────────────────────────

export type BreakStrength = 'none' | 'x-weak' | 'weak' | 'medium' | 'strong' | 'x-strong';

export interface BreakInstruction {
  afterText?: string;
  beforeText?: string;
  strength?: BreakStrength;
  durationMs?: number;
}

// ── Emotion & tone ─────────────────────────────────────────────────────────

export type EmotionStyle =
  | 'neutral'
  | 'friendly'
  | 'warm'
  | 'cheerful'
  | 'excited'
  | 'calm'
  | 'serious'
  | 'empathetic'
  | 'concerned'
  | 'surprised'
  | 'confident'
  | 'encouraging'
  | 'disappointed'
  | 'polite';

export type EmotionDegree = 0 | 0.25 | 0.5 | 0.75 | 1;

export type TonePreset =
  | 'clear-instruction'
  | 'natural-conversation'
  | 'shadowing-standard'
  | 'news-neutral'
  | 'storytelling-light'
  | 'question-friendly'
  | 'announcement-formal';

// ── Prosody numbers ────────────────────────────────────────────────────────

// Engine-neutral prosody knobs. `rate` is a multiplier (1 = normal speed),
// `pitch` is in semitones relative to the voice default, `volume` is a 0..1
// gain. Adapters translate these into SSML, API params or markup.
export interface ProsodyOverride {
  rate?: number;
  pitch?: number;
  volume?: number;
  preserveRhythm?: boolean;
}

export interface ProsodyInstruction {
  rate?: number;
  pitch?: number;
  volume?: number;
  style?: EmotionStyle;
  styleDegree?: number;
  breaks?: BreakInstruction[];
  emphasis?: EmphasisInstruction[];
}

// ── Requests & plans ───────────────────────────────────────────────────────

export type SpeechLanguage = 'en-US' | 'en-GB';

export interface SpeechRequest {
  id: string;
  text: string;
  context: SpeechContext;
  language: SpeechLanguage;
  tonePreset?: TonePreset;
  emotion?: EmotionStyle;
  emotionDegree?: EmotionDegree;
  prosody?: ProsodyOverride;
  emphasis?: EmphasisInstruction[];
  breaks?: BreakInstruction[];
  metadata?: Record<string, unknown>;
}

// The intermediate plan produced by the planner and consumed by adapters.
// Everything is fully resolved here — adapters never re-run analysis.
export interface SpeechPlan {
  id: string;
  originalText: string;
  normalizedText: string;
  sentenceType: SentenceType;
  context: SpeechContext;
  language: SpeechLanguage;
  tonePreset: TonePreset;
  emotion: EmotionStyle;
  emotionDegree: EmotionDegree;
  prosody: Required<Omit<ProsodyOverride, 'preserveRhythm'>> & { preserveRhythm: boolean };
  emphasis: EmphasisInstruction[];
  breaks: BreakInstruction[];
}

export type ResolvedProsody = SpeechPlan['prosody'];
