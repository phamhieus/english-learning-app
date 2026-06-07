// Independent, ordered prosody rules. Each rule is a small pure object that
// takes the current plan (+ the originating request, which carries any manual
// configuration) and returns an updated plan. Rules never mutate their input.
//
// Order matters and is fixed by RULE_PIPELINE at the bottom of this file.
// ManualOverrideRule always runs last so manual config wins (BR-02).

import {
  CONTRAST_PHRASES,
  CONTRAST_WORDS,
  NEGATIONS,
  NUMBER_WORDS,
  WH_WORDS,
  escapeRegExp,
  isChoiceQuestion,
  isCommand,
  isExclamation,
  isInterjection,
  isList,
  isRequest,
  isShortResponse,
  isTagQuestion,
  isWhQuestion,
  isYesNoQuestion,
} from './text';
import { LINE_BREAK, PARAGRAPH_BREAK, PROTECTED_PHRASES, PUNCTUATION_BREAKS, SHADOWING_MAX_EMOTION_DEGREE } from './presets';
import type {
  BreakInstruction,
  EmotionDegree,
  EmphasisInstruction,
  EmphasisLevel,
  SentenceType,
  SpeechPlan,
  SpeechRequest,
} from './types';

export interface ProsodyRule {
  name: string;
  apply(plan: SpeechPlan, request: SpeechRequest): SpeechPlan;
}

// ── Immutable update helpers ───────────────────────────────────────────────

const LEVEL_RANK: Record<EmphasisLevel, number> = { none: 0, reduced: 1, moderate: 2, strong: 3 };

function withEmphasis(plan: SpeechPlan, additions: EmphasisInstruction[]): SpeechPlan {
  if (additions.length === 0) return plan;
  const byText = new Map<string, EmphasisInstruction>();
  for (const e of plan.emphasis) byText.set(e.text, e);
  for (const add of additions) {
    if (!add.text.trim() || add.level === 'none') continue;
    const existing = byText.get(add.text);
    if (!existing || LEVEL_RANK[add.level] > LEVEL_RANK[existing.level]) {
      byText.set(add.text, { ...add });
    }
  }
  return { ...plan, emphasis: [...byText.values()] };
}

function withBreaks(plan: SpeechPlan, additions: BreakInstruction[]): SpeechPlan {
  if (additions.length === 0) return plan;
  const key = (b: BreakInstruction) => `${b.afterText ?? ''}|${b.beforeText ?? ''}|${b.strength ?? ''}|${b.durationMs ?? ''}`;
  const seen = new Set(plan.breaks.map(key));
  const fresh = additions.filter((b) => !seen.has(key(b)));
  return fresh.length ? { ...plan, breaks: [...plan.breaks, ...fresh] } : plan;
}

// Would inserting a break after `afterText` split a protected phrase? §8.4
function splitsProtectedPhrase(text: string, afterText: string): boolean {
  const idx = text.indexOf(afterText);
  if (idx === -1) return false;
  const boundary = idx + afterText.length;
  return PROTECTED_PHRASES.some((phrase) => {
    const re = new RegExp(escapeRegExp(phrase), 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index < boundary && boundary < m.index + m[0].length) return true;
    }
    return false;
  });
}

// Collect exact-case matches of a regex (group 1 if present, else full match).
function collectMatches(text: string, re: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  while ((m = g.exec(text)) !== null) {
    out.push((m[1] ?? m[0]).trim());
    if (m.index === g.lastIndex) g.lastIndex++;
  }
  return out;
}

// ── 1. Sentence type ───────────────────────────────────────────────────────

export const DetectSentenceTypeRule: ProsodyRule = {
  name: 'DetectSentenceTypeRule',
  apply(plan) {
    return { ...plan, sentenceType: classifySentence(plan.normalizedText) };
  },
};

export function classifySentence(sentence: string): SentenceType {
  const t = sentence.trim();
  if (!t) return 'statement';
  if (isInterjection(t)) return 'interjection';
  if (isShortResponse(t)) return 'short-response';
  if (t.endsWith('?')) {
    if (isTagQuestion(t)) return 'tag-question';
    if (isChoiceQuestion(t)) return 'choice-question';
    if (isWhQuestion(t)) return 'wh-question';
    // A polite "Could you…?" reads as a request, not a flat Yes/No question.
    if (isRequest(t)) return 'request';
    if (isYesNoQuestion(t)) return 'yes-no-question';
  }
  if (isExclamation(t)) return 'exclamation';
  if (isRequest(t)) return 'request';
  if (isCommand(t)) return 'command';
  if (isList(t)) return 'list';
  return 'statement';
}

// ── 2. Question intonation ─────────────────────────────────────────────────

export const QuestionIntonationRule: ProsodyRule = {
  name: 'QuestionIntonationRule',
  apply(plan) {
    // Yes/No and genuine confirmation tag questions rise at the end → a small
    // upward pitch nudge that the SSML builder turns into a rising contour.
    if (plan.sentenceType === 'yes-no-question' || plan.sentenceType === 'tag-question') {
      return { ...plan, prosody: { ...plan.prosody, pitch: plan.prosody.pitch + 1 } };
    }
    return plan;
  },
};

// ── 3 & 4. Breaks from punctuation, lines and paragraphs ───────────────────

export const PunctuationBreakRule: ProsodyRule = {
  name: 'PunctuationBreakRule',
  apply(plan) {
    const text = plan.normalizedText;
    const breaks: BreakInstruction[] = [];
    const re = /([^.,;:!?—\n]+)([.,;:!?—])/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const chunk = m[1].trim();
      const mark = m[2];
      const strength = PUNCTUATION_BREAKS[mark];
      if (!strength || !chunk) continue;
      const afterText = `${chunk}${mark}`;
      if (splitsProtectedPhrase(text, afterText)) continue;
      breaks.push({ afterText, strength });
    }
    return withBreaks(plan, breaks);
  },
};

export const ParagraphBreakRule: ProsodyRule = {
  name: 'ParagraphBreakRule',
  apply(plan) {
    const text = plan.normalizedText;
    const breaks: BreakInstruction[] = [];
    // Paragraph (blank line) and single line breaks.
    const paragraphRe = /([^\n]+)\n\n/g;
    const lineRe = /([^\n]+)\n(?!\n)/g;
    for (const m of collectMatches(text, paragraphRe)) breaks.push({ afterText: m, strength: PARAGRAPH_BREAK });
    for (const m of collectMatches(text, lineRe)) breaks.push({ afterText: m, strength: LINE_BREAK });
    return withBreaks(plan, breaks);
  },
};

// ── 5. Number & time emphasis ──────────────────────────────────────────────

const UNIT_WORDS =
  'percent|seconds?|minutes?|hours?|days?|weeks?|months?|years?|people|persons?|dollars?|euros?|pounds?|kilograms?|kg|grams?|points?|degrees?|times?|items?|words?';

export const NumberEmphasisRule: ProsodyRule = {
  name: 'NumberEmphasisRule',
  apply(plan) {
    const text = plan.normalizedText;
    const additions: EmphasisInstruction[] = [];
    // Digit quantities, optionally carrying a unit: "45 seconds", "20 percent", "12".
    const digitUnit = new RegExp(`\\b(\\d+(?:\\.\\d+)?\\s*(?:%|${UNIT_WORDS})?)`, 'gi');
    for (const match of collectMatches(text, digitUnit)) {
      additions.push({ text: match.replace(/\s+/g, ' ').trim(), level: 'strong' });
    }
    // Spelled-out quantity + noun: "three people".
    const wordUnit = new RegExp(`\\b(${NUMBER_WORDS.join('|')})\\s+(${UNIT_WORDS})\\b`, 'gi');
    for (const match of collectMatches(text, wordUnit)) {
      additions.push({ text: match.trim(), level: 'moderate' });
    }
    return withEmphasis(plan, additions);
  },
};

export const TimeExpressionEmphasisRule: ProsodyRule = {
  name: 'TimeExpressionEmphasisRule',
  apply(plan) {
    const text = plan.normalizedText;
    const additions: EmphasisInstruction[] = [];
    // Clock times: "9 a.m.", "9:30 pm", "nine o'clock".
    const clock = /\b(\d{1,2}(?::\d{2})?\s*(?:a\.m\.|p\.m\.|am|pm|o'clock))/gi;
    const spelled = new RegExp(`\\b((?:${NUMBER_WORDS.join('|')})\\s+o'clock)`, 'gi');
    for (const match of collectMatches(text, clock)) additions.push({ text: match.trim(), level: 'strong' });
    for (const match of collectMatches(text, spelled)) additions.push({ text: match.trim(), level: 'strong' });
    return withEmphasis(plan, additions);
  },
};

// ── 6. Negation, Wh-word, contrast ─────────────────────────────────────────

export const NegationEmphasisRule: ProsodyRule = {
  name: 'NegationEmphasisRule',
  apply(plan) {
    const text = plan.normalizedText;
    const additions: EmphasisInstruction[] = [];
    for (const neg of NEGATIONS) {
      const re = new RegExp(`\\b${escapeRegExp(neg)}\\b`, 'gi');
      for (const match of collectMatches(text, re)) additions.push({ text: match, level: 'moderate' });
    }
    return withEmphasis(plan, additions);
  },
};

export const WhWordEmphasisRule: ProsodyRule = {
  name: 'WhWordEmphasisRule',
  apply(plan) {
    const text = plan.normalizedText;
    const additions: EmphasisInstruction[] = [];
    const isWh = plan.sentenceType === 'wh-question';
    for (const wh of WH_WORDS) {
      const re = new RegExp(`\\b${escapeRegExp(wh)}\\b`, 'gi');
      const matches = collectMatches(text, re);
      matches.forEach((match, i) => {
        // The leading question word of a Wh-question gets the strongest stress.
        const level: EmphasisLevel = isWh && i === 0 ? 'strong' : 'moderate';
        additions.push({ text: match, level });
      });
    }
    return withEmphasis(plan, additions);
  },
};

export const ContrastEmphasisRule: ProsodyRule = {
  name: 'ContrastEmphasisRule',
  apply(plan) {
    const text = plan.normalizedText;
    const additions: EmphasisInstruction[] = [];
    // Connectors signalling contrast.
    for (const word of CONTRAST_WORDS) {
      const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
      for (const match of collectMatches(text, re)) additions.push({ text: match, level: 'moderate' });
    }
    for (const phrase of CONTRAST_PHRASES) {
      const re = new RegExp(escapeRegExp(phrase), 'gi');
      for (const match of collectMatches(text, re)) additions.push({ text: match, level: 'moderate' });
    }
    // Contrastive stress: "the blue one, not the green one" → stress both heads + not.
    const contrastive = /\b(\w+)\s+one\s*,\s*(not)\s+(?:the\s+|a\s+|an\s+)?(\w+)\s+one\b/gi;
    let m: RegExpExecArray | null;
    while ((m = contrastive.exec(text)) !== null) {
      additions.push({ text: m[1], level: 'strong' });
      additions.push({ text: m[2], level: 'strong' });
      additions.push({ text: m[3], level: 'strong' });
    }
    return withEmphasis(plan, additions);
  },
};

// ── 7. Context tone refinement ─────────────────────────────────────────────

export const InstructionToneRule: ProsodyRule = {
  name: 'InstructionToneRule',
  apply(plan) {
    if (plan.context !== 'instruction') return plan;
    // Instructions stay clear and unhurried with minimal emotion.
    const degree = Math.min(plan.emotionDegree, 0.25) as EmotionDegree;
    return { ...plan, emotionDegree: degree };
  },
};

export const DialogueToneRule: ProsodyRule = {
  name: 'DialogueToneRule',
  apply(plan) {
    if (plan.context !== 'dialogue') return plan;
    // Replies should not sound flat — give neutral short answers a little warmth.
    if ((plan.sentenceType === 'short-response' || plan.sentenceType === 'interjection') && plan.emotion === 'neutral') {
      return { ...plan, emotion: 'friendly' };
    }
    return plan;
  },
};

export const ShadowingToneRule: ProsodyRule = {
  name: 'ShadowingToneRule',
  apply(plan) {
    if (plan.context !== 'shadowing') return plan;
    // Keep it easy to imitate: cap emotion and preserve the natural rhythm.
    const degree = Math.min(plan.emotionDegree, SHADOWING_MAX_EMOTION_DEGREE) as EmotionDegree;
    return { ...plan, emotionDegree: degree, prosody: { ...plan.prosody, preserveRhythm: true } };
  },
};

// ── 8. Manual override (always last) ───────────────────────────────────────

export const ManualOverrideRule: ProsodyRule = {
  name: 'ManualOverrideRule',
  apply(plan, request) {
    let next = plan;
    if (request.emotion) next = { ...next, emotion: request.emotion };
    if (request.emotionDegree !== undefined) next = { ...next, emotionDegree: request.emotionDegree };
    // Manual emphasis/breaks are added with priority — they win merge conflicts.
    if (request.emphasis?.length) {
      const manual = new Map(request.emphasis.map((e) => [e.text, e] as const));
      const kept = next.emphasis.filter((e) => !manual.has(e.text));
      next = { ...next, emphasis: [...kept, ...request.emphasis] };
    }
    if (request.breaks?.length) {
      next = { ...next, breaks: [...next.breaks, ...request.breaks] };
    }
    return next;
  },
};

// Fixed execution order. Manual override is last (BR-02).
export const RULE_PIPELINE: ProsodyRule[] = [
  DetectSentenceTypeRule,
  QuestionIntonationRule,
  PunctuationBreakRule,
  ParagraphBreakRule,
  NumberEmphasisRule,
  TimeExpressionEmphasisRule,
  NegationEmphasisRule,
  WhWordEmphasisRule,
  ContrastEmphasisRule,
  InstructionToneRule,
  DialogueToneRule,
  ShadowingToneRule,
  ManualOverrideRule,
];
