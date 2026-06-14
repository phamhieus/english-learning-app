import type { EssayTheme } from '../types/toeic-writing.types';

// ── Theme classification ─────────────────────────────────────────────────────
// The TOEIC Q8 prompt bank only tags one coarse topicGroup, so we infer a
// finer subject theme from the prompt wording. Order matters: the first theme
// whose keywords match wins, which lets specific themes (e.g. a "social media"
// prompt → Technology) take priority over the broad Workplace catch-all.

export interface EssayThemeMeta {
  id: EssayTheme;
  label: string;
  keywords: RegExp;
}

// Keywords match at a word boundary by prefix (no trailing \b) so plurals and
// inflections are caught too — e.g. "advertis" → "advertising", "student" →
// "students".
export const ESSAY_THEMES: EssayThemeMeta[] = [
  { id: 'technology', label: 'Technology & Media', keywords: /\b(ai\b|artificial intelligence|social media|robot|automation|digital)/i },
  { id: 'money', label: 'Money & Finance', keywords: /\b(sav(e|ing)|financ|budget|salary|money)/i },
  { id: 'education-career', label: 'Education & Career', keywords: /\b(student|part-time|learn|study|education|career|skill)/i },
  { id: 'city-environment', label: 'City & Environment', keywords: /\b(public transport|private car|cit(y|ies)|environment|pollution|traffic)/i },
  { id: 'business-consumer', label: 'Business & Consumers', keywords: /\b(online shop|customer service|advertis|consumer|marketing|small business)/i },
  { id: 'workplace', label: 'Workplace', keywords: /\b(work|office|employee|training|flexible|teamwork|business travel|productive|compan)/i },
];

const THEME_LABELS = Object.fromEntries(ESSAY_THEMES.map((t) => [t.id, t.label])) as Record<EssayTheme, string>;

/** Infers the subject theme of a prompt. Falls back to 'workplace'. */
export const classifyTheme = (prompt: string): EssayTheme => {
  const found = ESSAY_THEMES.find((theme) => theme.keywords.test(prompt));
  return found ? found.id : 'workplace';
};

export const themeLabel = (theme: EssayTheme): string => THEME_LABELS[theme];
