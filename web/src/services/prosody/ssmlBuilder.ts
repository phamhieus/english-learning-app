// Builds valid SSML from a SpeechPlan for engines that support it (e.g. Azure,
// Google, Polly). Emphasis spans and breaks are woven into the text; rate and
// pitch come from the resolved prosody; Yes/No questions get a rising contour.
//
// Everything emitted as text is XML-escaped (§13, AC-09).

import type { BreakInstruction, EmphasisInstruction, SpeechPlan } from './types';

export interface SsmlBuilder {
  build(plan: SpeechPlan): string;
}

interface ClaimedSpan {
  start: number;
  end: number;
  level: EmphasisInstruction['level'];
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatPitch(semitones: number): string {
  return `${semitones >= 0 ? '+' : ''}${semitones}st`;
}

// Locate non-overlapping spans for the emphasis list. Longer phrases are claimed
// first so "9 a.m." wins over a bare "9" inside it (§7, §8.4 spirit).
function claimEmphasisSpans(text: string, emphasis: EmphasisInstruction[]): ClaimedSpan[] {
  const ordered = [...emphasis]
    .filter((e) => e.text.trim() && e.level !== 'none')
    .sort((a, b) => b.text.length - a.text.length);
  const claimed: ClaimedSpan[] = [];
  const overlaps = (s: number, e: number) => claimed.some((c) => s < c.end && c.start < e);

  for (const item of ordered) {
    let from = 0;
    while (from <= text.length) {
      const idx = text.indexOf(item.text, from);
      if (idx === -1) break;
      const end = idx + item.text.length;
      if (!overlaps(idx, end)) {
        claimed.push({ start: idx, end, level: item.level });
        break;
      }
      from = idx + 1;
    }
  }
  return claimed.sort((a, b) => a.start - b.start);
}

// Map each break's afterText to an insertion position in the text.
function resolveBreakPositions(text: string, breaks: BreakInstruction[]): { pos: number; strength: string }[] {
  const out: { pos: number; strength: string }[] = [];
  for (const b of breaks) {
    if (!b.strength && !b.durationMs) continue;
    const attr = b.durationMs ? `time="${b.durationMs}ms"` : `strength="${b.strength}"`;
    if (b.afterText) {
      const idx = text.indexOf(b.afterText);
      if (idx !== -1) out.push({ pos: idx + b.afterText.length, strength: attr });
    } else if (b.beforeText) {
      const idx = text.indexOf(b.beforeText);
      if (idx !== -1) out.push({ pos: idx, strength: attr });
    }
  }
  return out.sort((a, b) => a.pos - b.pos);
}

export class DefaultSsmlBuilder implements SsmlBuilder {
  build(plan: SpeechPlan): string {
    const text = plan.normalizedText;
    const spans = claimEmphasisSpans(text, plan.emphasis);
    const breaks = resolveBreakPositions(text, plan.breaks);

    // Emit escaped text for [from,to), inserting any break tags that fall inside.
    const emit = (from: number, to: number): string => {
      let out = '';
      let cursor = from;
      for (const brk of breaks) {
        if (brk.pos > from && brk.pos < to) {
          out += escapeXml(text.slice(cursor, brk.pos)) + `<break ${brk.strength} />`;
          cursor = brk.pos;
        }
      }
      return out + escapeXml(text.slice(cursor, to));
    };

    let body = '';
    let cursor = 0;
    for (const span of spans) {
      body += emit(cursor, span.start);
      const level = span.level === 'none' ? 'moderate' : span.level;
      body += `<emphasis level="${level}">${escapeXml(text.slice(span.start, span.end))}</emphasis>`;
      cursor = span.end;
    }
    body += emit(cursor, text.length);

    const rising = plan.sentenceType === 'yes-no-question' || plan.sentenceType === 'tag-question';
    const ratePct = `${Math.round(plan.prosody.rate * 100)}%`;
    const prosodyAttrs = rising
      ? `rate="${ratePct}" contour="(10%,+0st) (90%,+4st)"`
      : `rate="${ratePct}" pitch="${formatPitch(plan.prosody.pitch)}"`;

    return `<speak xml:lang="${plan.language}"><prosody ${prosodyAttrs}>${body}</prosody></speak>`;
  }
}

export const defaultSsmlBuilder = new DefaultSsmlBuilder();

export function buildSsml(plan: SpeechPlan): string {
  return defaultSsmlBuilder.build(plan);
}
