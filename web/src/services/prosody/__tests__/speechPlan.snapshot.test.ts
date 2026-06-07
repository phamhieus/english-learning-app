import { describe, expect, it } from 'vitest';
import { buildSpeechPlan } from '../planner';
import { buildSsml } from '../ssmlBuilder';
import type { SpeechContext, SpeechRequest } from '../index';

// Snapshot the full SpeechPlan + SSML for the canonical spec sentences (§18).
// Regenerate intentionally with `vitest -u` when prosody behaviour changes.
const cases: Array<{ name: string; request: SpeechRequest }> = [
  {
    name: 'yes-no-question',
    request: { id: 'c2', text: 'Are you ready?', context: 'question', language: 'en-US' },
  },
  {
    name: 'wh-question',
    request: { id: 'c3', text: 'Where are you going?', context: 'question', language: 'en-US' },
  },
  {
    name: 'instruction-number',
    request: { id: 'c1', text: 'You will have 45 seconds to prepare.', context: 'instruction', language: 'en-US' },
  },
  {
    name: 'contrastive-stress',
    request: { id: 'c4', text: 'I ordered the blue one, not the green one.', context: 'dialogue', language: 'en-US' },
  },
  {
    name: 'polite-request',
    request: { id: 'c5', text: 'Could you help me with this?', context: 'dialogue', language: 'en-US' },
  },
  {
    name: 'surprised-really',
    request: {
      id: 'c6',
      text: 'Really?',
      context: 'dialogue',
      emotion: 'surprised',
      emotionDegree: 0.5,
      language: 'en-US',
    },
  },
  {
    name: 'shadowing',
    request: {
      id: 'c7',
      text: "I'd like to book a table for two, please.",
      context: 'shadowing',
      language: 'en-US',
    },
  },
];

describe('SpeechPlan snapshots', () => {
  for (const { name, request } of cases) {
    it(`plan: ${name}`, () => {
      expect(buildSpeechPlan(request)).toMatchSnapshot();
    });
    it(`ssml: ${name}`, () => {
      expect(buildSsml(buildSpeechPlan(request))).toMatchSnapshot();
    });
  }
});

describe('same text, different emotion → different plan (AC-10)', () => {
  const base = (emotion: SpeechRequest['emotion']): SpeechRequest => ({
    id: 'ac10',
    text: 'Really?',
    context: 'dialogue' as SpeechContext,
    emotion,
    emotionDegree: 0.5,
    language: 'en-US',
  });

  it('produces different prosody for surprised vs disappointed', () => {
    const surprised = buildSpeechPlan(base('surprised'));
    const disappointed = buildSpeechPlan(base('disappointed'));
    expect(surprised.prosody).not.toEqual(disappointed.prosody);
  });
});
