import type { EssayChecklistItem, EssayQuestionType } from '../types/toeic-writing.types';

// ── Prompt classification ───────────────────────────────────────────────────
// TOEIC Q8 prompts fall into a few recognisable patterns. We infer the type
// from the wording so the UI can show the right "how to answer" hint without
// needing extra data on each prompt.
const TYPE_LABELS: Record<EssayQuestionType, string> = {
  'agree-disagree': 'Agree / Disagree',
  'advantages-disadvantages': 'Advantages / Disadvantages',
  preference: 'Preference',
  'general-opinion': 'Opinion',
};

const TYPE_HINTS: Record<EssayQuestionType, string> = {
  'agree-disagree':
    'State whether you agree or disagree, then defend that single position with reasons and examples.',
  'advantages-disadvantages':
    'Weigh the benefits against the drawbacks, then make clear which side is stronger.',
  preference:
    'Pick one option, explain why you prefer it, and support the choice with concrete examples.',
  'general-opinion':
    'Give a clear opinion on the topic and back it up with specific reasons and real-life examples.',
};

export const classifyQuestionType = (prompt: string): EssayQuestionType => {
  const text = prompt.toLowerCase();
  if (/\bagree or disagree\b|\bdo you agree\b|\bagree with\b/.test(text)) return 'agree-disagree';
  if (/\badvantage|\bdisadvantage|\bbenefit|\bdrawback|outweigh/.test(text)) return 'advantages-disadvantages';
  if (/\bprefer\b|\bpreference\b|which (one|option|do you)|better to\b|\brather\b/.test(text)) return 'preference';
  return 'general-opinion';
};

export const questionTypeLabel = (type: EssayQuestionType): string => TYPE_LABELS[type];
export const questionTypeHint = (type: EssayQuestionType): string => TYPE_HINTS[type];

// ── Word / structure helpers ────────────────────────────────────────────────
export const countWords = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

export const countSentences = (text: string): number =>
  text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;

export const countParagraphs = (text: string): number =>
  text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean).length;

const COMMON_MISSPELLINGS = ['becuase', 'definately', 'enviroment', 'goverment', 'imporant', 'recieve', 'seperate', 'wich', 'writting'];
const CONNECTORS =
  /\b(firstly|secondly|first of all|to begin with|in addition|moreover|furthermore|however|on the other hand|for example|for instance|as a result|therefore|in conclusion|to sum up|overall)\b/i;
const OPINION_MARKERS =
  /\b(i (strongly )?(believe|think|agree|disagree)|in my opinion|from my perspective|i am convinced|personally)\b/i;
const EXAMPLE_MARKERS = /\b(for example|for instance|such as|to illustrate|in my experience|a good example)\b/i;

export const ESSAY_MIN_WORDS = 300;

/**
 * Live checklist for the Part 3 opinion essay, mirroring how the generic
 * WritingEditor builds its checklist but specialised to the essay rubric:
 * clear opinion, 300+ words, intro/body/conclusion, supporting examples,
 * connectors and clean grammar.
 */
export const buildEssayChecklist = (text: string): EssayChecklistItem[] => {
  const words = countWords(text);
  const sentences = countSentences(text);
  const paragraphs = countParagraphs(text);
  const hasMisspelling = COMMON_MISSPELLINGS.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(text));

  return [
    {
      label: 'State a clear opinion (thesis)',
      done: OPINION_MARKERS.test(text) && sentences >= 1,
    },
    {
      label: `Write at least ${ESSAY_MIN_WORDS} words`,
      done: words >= ESSAY_MIN_WORDS,
    },
    {
      label: 'Intro · 2 body paragraphs · conclusion',
      done: paragraphs >= 4 && CONNECTORS.test(text),
    },
    {
      label: 'Support reasons with specific examples',
      done: EXAMPLE_MARKERS.test(text) && words >= Math.ceil(ESSAY_MIN_WORDS * 0.6),
    },
    {
      label: 'Accurate grammar and spelling',
      done: words >= 50 && !hasMisspelling,
    },
  ];
};
