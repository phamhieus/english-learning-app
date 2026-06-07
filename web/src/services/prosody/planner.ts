// ProsodyPlanner — turns a SpeechRequest into a fully resolved SpeechPlan.
//
// Pipeline (BR-01):
//   normalize → seed plan from tone/context preset → run rule engine →
//   resolve final prosody numbers (emotion + manual override).
//
// Priority (BR-02): manual override > content-type preset > rule-based.

import { CONTEXT_TONE_DEFAULT, EMOTION_PRESETS, SHADOWING_MAX_EMOTION_DEGREE, TONE_PRESETS } from './presets';
import { ProsodyRuleEngine } from './ruleEngine';
import { normalizeText } from './text';
import type {
  EmotionDegree,
  ResolvedProsody,
  SpeechPlan,
  SpeechRequest,
} from './types';

export interface ProsodyPlanner {
  buildSpeechPlan(request: SpeechRequest): SpeechPlan;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round2 = (value: number) => Math.round(value * 100) / 100;

export class RuleBasedProsodyPlanner implements ProsodyPlanner {
  private readonly engine: ProsodyRuleEngine;

  constructor(engine: ProsodyRuleEngine = new ProsodyRuleEngine()) {
    this.engine = engine;
  }

  buildSpeechPlan(request: SpeechRequest): SpeechPlan {
    const normalizedText = normalizeText(request.text);
    const tonePreset = request.tonePreset ?? CONTEXT_TONE_DEFAULT[request.context];
    const tone = TONE_PRESETS[tonePreset];

    // Seed: tone preset supplies the baseline; request emotion (if any) wins.
    const seed: SpeechPlan = {
      id: request.id,
      originalText: request.text,
      normalizedText,
      sentenceType: 'statement',
      context: request.context,
      language: request.language,
      tonePreset,
      emotion: request.emotion ?? tone.emotion,
      emotionDegree: request.emotionDegree ?? tone.emotionDegree,
      prosody: {
        rate: tone.rate,
        pitch: tone.pitch,
        volume: 1,
        preserveRhythm: tone.preserveRhythm ?? false,
      },
      emphasis: [],
      breaks: [],
    };

    const analysed = this.engine.run(seed, request);

    // AC-07 safety net: shadowing must stay easy to imitate, so its emotion is
    // capped even when a manual override tried to push it higher.
    const capped: SpeechPlan =
      analysed.context === 'shadowing' && analysed.emotionDegree > SHADOWING_MAX_EMOTION_DEGREE
        ? { ...analysed, emotionDegree: SHADOWING_MAX_EMOTION_DEGREE }
        : analysed;

    return { ...capped, prosody: this.resolveProsody(capped, request) };
  }

  // Final numeric pass: layer emotion onto the (rule-adjusted) baseline, then
  // apply any manual prosody override at the highest priority.
  private resolveProsody(plan: SpeechPlan, request: SpeechRequest): ResolvedProsody {
    const emotion = EMOTION_PRESETS[plan.emotion];
    const degree: EmotionDegree = plan.emotionDegree;

    const rateFactor = 1 + (emotion.rate - 1) * degree;
    let rate = round2(plan.prosody.rate * rateFactor);
    let pitch = Math.round(plan.prosody.pitch + emotion.pitch * degree);
    let volume = round2(clamp(0.9 + emotion.energy * 0.05 * degree, 0.5, 1));
    let preserveRhythm = plan.prosody.preserveRhythm;

    const override = request.prosody;
    if (override) {
      if (override.rate !== undefined) rate = override.rate;
      if (override.pitch !== undefined) pitch = override.pitch;
      if (override.volume !== undefined) volume = override.volume;
      if (override.preserveRhythm !== undefined) preserveRhythm = override.preserveRhythm;
    }

    return {
      rate: clamp(rate, 0.5, 2),
      pitch,
      volume: clamp(volume, 0, 1),
      preserveRhythm,
    };
  }
}

// Convenience singleton + function for callers that don't need a custom engine.
export const defaultProsodyPlanner = new RuleBasedProsodyPlanner();

export function buildSpeechPlan(request: SpeechRequest): SpeechPlan {
  return defaultProsodyPlanner.buildSpeechPlan(request);
}
