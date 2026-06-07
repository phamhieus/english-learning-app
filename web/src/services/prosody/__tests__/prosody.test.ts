import { describe, expect, it } from 'vitest';
import { buildSpeechPlan } from '../planner';
import { classifySentence } from '../rules';
import { buildSsml, escapeXml } from '../ssmlBuilder';
import { planToEnginePayload, WebSpeechTtsAdapter } from '../adapters';
import type { EngineCapabilities, SpeechRequest } from '../index';

const req = (text: string, overrides: Partial<SpeechRequest> = {}): SpeechRequest => ({
  id: 'test',
  text,
  context: 'dialogue',
  language: 'en-US',
  ...overrides,
});

const hasEmphasis = (plan: ReturnType<typeof buildSpeechPlan>, text: string, level?: string) =>
  plan.emphasis.some((e) => e.text === text && (level ? e.level === level : true));

describe('sentence type detection', () => {
  it('detects a statement', () => {
    expect(classifySentence('The meeting starts at nine.')).toBe('statement');
  });
  it('detects a Yes/No question', () => {
    expect(classifySentence('Are you ready?')).toBe('yes-no-question');
  });
  it('detects a Wh-question', () => {
    expect(classifySentence('Where are you going?')).toBe('wh-question');
  });
  it('detects a request', () => {
    expect(classifySentence('Could you help me with this?')).toBe('request');
  });
  it('detects a command', () => {
    expect(classifySentence('Please open the window.')).toBe('command');
  });
  it('detects an exclamation', () => {
    expect(classifySentence("That's amazing!")).toBe('exclamation');
  });
  it('detects a tag question', () => {
    expect(classifySentence("You're coming, aren't you?")).toBe('tag-question');
  });
  it('detects a choice question', () => {
    expect(classifySentence('Would you like tea or coffee?')).toBe('choice-question');
  });
  it('detects a short response', () => {
    expect(classifySentence('Exactly.')).toBe('short-response');
  });
  it('detects an interjection', () => {
    expect(classifySentence('Wow!')).toBe('interjection');
  });
});

describe('emphasis rules', () => {
  it('emphasises numbers with their unit', () => {
    const plan = buildSpeechPlan(req('You will have 45 seconds to prepare.', { context: 'instruction' }));
    expect(hasEmphasis(plan, '45 seconds')).toBe(true);
  });

  it('emphasises time expressions', () => {
    const plan = buildSpeechPlan(req('The call is on Monday at 9 a.m.', { context: 'instruction' }));
    expect(hasEmphasis(plan, '9 a.m.')).toBe(true);
  });

  it('emphasises negations', () => {
    const plan = buildSpeechPlan(req("I do not agree."));
    const not = plan.emphasis.find((e) => e.text === 'not');
    expect(not).toBeTruthy();
    expect(['moderate', 'strong']).toContain(not?.level);
  });

  it('emphasises the Wh-word in a Wh-question', () => {
    const plan = buildSpeechPlan(req('Where are you going?', { context: 'question' }));
    expect(hasEmphasis(plan, 'Where', 'strong')).toBe(true);
  });

  it('applies contrastive stress (blue / not / green)', () => {
    const plan = buildSpeechPlan(req('I ordered the blue one, not the green one.'));
    expect(hasEmphasis(plan, 'blue', 'strong')).toBe(true);
    expect(hasEmphasis(plan, 'not', 'strong')).toBe(true);
    expect(hasEmphasis(plan, 'green', 'strong')).toBe(true);
  });
});

describe('break rules', () => {
  it('adds a weak break after a comma and medium after a period', () => {
    const plan = buildSpeechPlan(req('First, open the document.'));
    expect(plan.breaks.some((b) => b.afterText === 'First,' && b.strength === 'weak')).toBe(true);
    expect(plan.breaks.some((b) => b.strength === 'medium')).toBe(true);
  });

  it('adds a paragraph break between paragraphs', () => {
    const plan = buildSpeechPlan(req('First line.\n\nSecond line.', { context: 'narration' }));
    expect(plan.breaks.some((b) => b.strength === 'x-strong')).toBe(true);
  });
});

describe('question intonation', () => {
  it('reads a Yes/No question differently from a statement', () => {
    const question = buildSpeechPlan(req('Are you ready?', { context: 'question' }));
    const statement = buildSpeechPlan(req('You are ready.', { context: 'narration' }));
    expect(question.sentenceType).toBe('yes-no-question');
    expect(buildSsml(question)).toContain('contour');
    expect(buildSsml(statement)).not.toContain('contour');
  });
});

describe('tone presets & emotion', () => {
  it('keeps shadowing emotion degree at or below 0.25 even with a manual override', () => {
    const plan = buildSpeechPlan(req('I would like to book a table for two, please.', {
      context: 'shadowing',
      emotion: 'excited',
      emotionDegree: 1,
    }));
    expect(plan.emotionDegree).toBeLessThanOrEqual(0.25);
  });

  it('lets manual emphasis win merge conflicts', () => {
    const plan = buildSpeechPlan(req('I did not say that.', {
      emphasis: [{ text: 'not', level: 'reduced' }],
    }));
    const not = plan.emphasis.find((e) => e.text === 'not');
    expect(not?.level).toBe('reduced'); // manual override beats the rule-based 'moderate'
  });

  it('applies a manual emotion override', () => {
    const plan = buildSpeechPlan(req('Really?', { emotion: 'surprised', emotionDegree: 0.5 }));
    expect(plan.emotion).toBe('surprised');
  });
});

describe('SSML builder', () => {
  it('escapes XML special characters', () => {
    expect(escapeXml(`Tom & "Jerry" <tag> 'x'`)).toBe('Tom &amp; &quot;Jerry&quot; &lt;tag&gt; &apos;x&apos;');
  });

  it('produces a single well-formed speak/prosody wrapper', () => {
    const plan = buildSpeechPlan(req('Tom & Jerry said "hello".'));
    const ssml = buildSsml(plan);
    expect(ssml.startsWith('<speak')).toBe(true);
    expect(ssml.endsWith('</speak>')).toBe(true);
    expect(ssml).not.toContain('& '); // ampersand must be escaped
    expect((ssml.match(/<speak/g) ?? []).length).toBe(1);
  });

  it('wraps emphasised numbers in an <emphasis> tag', () => {
    const plan = buildSpeechPlan(req('You will have 45 seconds to prepare.', { context: 'instruction' }));
    expect(buildSsml(plan)).toContain('<emphasis level="strong">45 seconds</emphasis>');
  });
});

describe('engine fallback', () => {
  const noCaps: EngineCapabilities = {
    supportsSsml: false,
    supportsEmotion: false,
    supportsPitch: false,
    supportsRate: false,
    supportsEmphasis: false,
    supportsBreaks: false,
  };

  it('falls back to plain text and records missing capabilities without throwing', () => {
    const plan = buildSpeechPlan(req('Where are you going?', { context: 'question' }));
    const payload = planToEnginePayload(plan, noCaps);
    expect(payload.ssml).toBeUndefined();
    expect(payload.text).toBe(plan.normalizedText);
    expect(payload.missingCapabilities).toEqual(
      expect.arrayContaining(['rate', 'pitch', 'emphasis', 'ssml']),
    );
  });

  it('keeps SSML and params when the engine is fully capable', () => {
    const fullCaps: EngineCapabilities = {
      supportsSsml: true,
      supportsEmotion: true,
      supportsPitch: true,
      supportsRate: true,
      supportsEmphasis: true,
      supportsBreaks: true,
    };
    const plan = buildSpeechPlan(req('Are you ready?', { context: 'question' }));
    const payload = planToEnginePayload(plan, fullCaps);
    expect(payload.ssml).toBeTruthy();
    expect(payload.params.rate).toBeGreaterThan(0);
    expect(payload.missingCapabilities).toHaveLength(0);
  });

  it('synthesizes through the WebSpeech adapter without a DOM and does not reject', async () => {
    const plan = buildSpeechPlan(req('Are you ready?', { context: 'question' }));
    const result = await new WebSpeechTtsAdapter().synthesize(plan);
    expect(result.engine).toBe('web-speech');
    expect(result.payload.missingCapabilities).toContain('speechSynthesis-unavailable');
  });
});
