// Public API for the prosody / natural-TTS module (Phase 1, rule-based MVP).
//
// Typical use:
//   const plan = buildSpeechPlan({ id, text, context: 'question', language: 'en-US' });
//   const ssml = buildSsml(plan);                 // for SSML-capable engines
//   await new WebSpeechTtsAdapter().synthesize(plan); // browser fallback

export * from './types';
export { buildSpeechPlan, RuleBasedProsodyPlanner, defaultProsodyPlanner } from './planner';
export type { ProsodyPlanner } from './planner';
export { ProsodyRuleEngine } from './ruleEngine';
export { RULE_PIPELINE, classifySentence } from './rules';
export type { ProsodyRule } from './rules';
export { buildSsml, escapeXml, DefaultSsmlBuilder, defaultSsmlBuilder } from './ssmlBuilder';
export type { SsmlBuilder } from './ssmlBuilder';
export {
  planToEnginePayload,
  BaseTtsEngineAdapter,
  WebSpeechTtsAdapter,
} from './adapters';
export type {
  TtsEngineAdapter,
  TtsAudioResult,
  EngineCapabilities,
  EnginePayload,
  WebSpeechAdapterOptions,
} from './adapters';
export {
  EMOTION_PRESETS,
  TONE_PRESETS,
  CONTEXT_TONE_DEFAULT,
  PUNCTUATION_BREAKS,
  SHADOWING_MAX_EMOTION_DEGREE,
} from './presets';

import type { SpeechRequest } from './types';
import { buildSpeechPlan } from './planner';
import { WebSpeechTtsAdapter, type TtsEngineAdapter, type TtsAudioResult } from './adapters';

// One-shot helper: plan + synthesize with a given engine (defaults to browser).
export async function synthesizeSpeech(
  request: SpeechRequest,
  adapter: TtsEngineAdapter = new WebSpeechTtsAdapter(),
): Promise<TtsAudioResult> {
  return adapter.synthesize(buildSpeechPlan(request));
}
