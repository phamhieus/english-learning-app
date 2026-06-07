// Engine-neutral TTS adapter layer (BR-04). A SpeechPlan is translated into the
// payload each engine can actually consume, with graceful fallback when an
// engine lacks SSML / emotion / pitch support (§14, AC-08).

import { buildSsml } from './ssmlBuilder';
import type { SpeechPlan } from './types';

export interface EngineCapabilities {
  supportsSsml: boolean;
  supportsEmotion: boolean;
  supportsPitch: boolean;
  supportsRate: boolean;
  supportsEmphasis: boolean;
  supportsBreaks: boolean;
}

export interface EnginePayload {
  // Present only when the engine supports SSML.
  ssml?: string;
  // Always present — the plain-text fallback / display-safe content.
  text: string;
  params: {
    rate?: number;
    pitch?: number;
    volume?: number;
    style?: string;
    styleDegree?: number;
  };
  missingCapabilities: string[];
}

export interface TtsAudioResult {
  engine: string;
  mode: 'native-playback' | 'audio-data';
  audio?: ArrayBuffer;
  payload: EnginePayload;
}

export interface TtsEngineAdapter extends EngineCapabilities {
  readonly name: string;
  synthesize(plan: SpeechPlan): Promise<TtsAudioResult>;
}

// Pure translation step — no I/O, easy to unit test. Capabilities the engine
// lacks are dropped from the payload and recorded in `missingCapabilities`
// rather than throwing.
export function planToEnginePayload(plan: SpeechPlan, caps: EngineCapabilities): EnginePayload {
  const missing: string[] = [];
  const params: EnginePayload['params'] = {};

  if (caps.supportsRate) params.rate = plan.prosody.rate;
  else missing.push('rate');

  if (caps.supportsPitch) params.pitch = plan.prosody.pitch;
  else missing.push('pitch');

  // Volume is universally cheap, so always pass it as an API param.
  params.volume = plan.prosody.volume;

  if (caps.supportsEmotion) {
    params.style = plan.emotion;
    params.styleDegree = plan.emotionDegree;
  } else if (plan.emotion !== 'neutral' && plan.emotionDegree > 0) {
    // Emotion is already partly baked into rate/pitch during planning, so
    // dropping the style label degrades gracefully.
    missing.push('emotion');
  }

  if (!caps.supportsEmphasis && plan.emphasis.length > 0) missing.push('emphasis');
  if (!caps.supportsBreaks && plan.breaks.length > 0) missing.push('breaks');

  const payload: EnginePayload = {
    text: plan.normalizedText,
    params,
    missingCapabilities: missing,
  };

  if (caps.supportsSsml) payload.ssml = buildSsml(plan);
  else missing.push('ssml');

  return payload;
}

// Shared base so concrete engines only implement the actual synthesis call.
export abstract class BaseTtsEngineAdapter implements TtsEngineAdapter {
  abstract readonly name: string;
  abstract supportsSsml: boolean;
  abstract supportsEmotion: boolean;
  abstract supportsPitch: boolean;
  abstract supportsRate: boolean;
  abstract supportsEmphasis: boolean;
  abstract supportsBreaks: boolean;

  protected toPayload(plan: SpeechPlan): EnginePayload {
    return planToEnginePayload(plan, this);
  }

  abstract synthesize(plan: SpeechPlan): Promise<TtsAudioResult>;
}

export interface WebSpeechAdapterOptions {
  // Lets callers reuse their own voice-selection logic (see useVoiceReader).
  resolveVoice?: (lang: string) => SpeechSynthesisVoice | null;
  logMissing?: (engine: string, missing: string[]) => void;
}

// Browser SpeechSynthesis: the app's baseline engine. No SSML, no emotion,
// no inline emphasis/breaks — only rate, pitch and volume. Everything else
// falls back cleanly (§14).
export class WebSpeechTtsAdapter extends BaseTtsEngineAdapter {
  readonly name = 'web-speech';
  supportsSsml = false;
  supportsEmotion = false;
  supportsPitch = true;
  supportsRate = true;
  supportsEmphasis = false;
  supportsBreaks = false;

  private readonly options: WebSpeechAdapterOptions;

  constructor(options: WebSpeechAdapterOptions = {}) {
    super();
    this.options = options;
  }

  synthesize(plan: SpeechPlan): Promise<TtsAudioResult> {
    const payload = this.toPayload(plan);
    if (payload.missingCapabilities.length) {
      (this.options.logMissing ?? defaultLogMissing)(this.name, payload.missingCapabilities);
    }

    const result: TtsAudioResult = { engine: this.name, mode: 'native-playback', payload };

    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      // No engine available (e.g. SSR / tests) — don't crash, just report it.
      payload.missingCapabilities.push('speechSynthesis-unavailable');
      return Promise.resolve(result);
    }

    return new Promise<TtsAudioResult>((resolve) => {
      const utter = new SpeechSynthesisUtterance(payload.text);
      utter.lang = plan.language;
      const voice = this.options.resolveVoice?.(plan.language) ?? null;
      if (voice) utter.voice = voice;
      if (payload.params.rate !== undefined) utter.rate = clampRate(payload.params.rate);
      if (payload.params.pitch !== undefined) utter.pitch = semitonesToWebSpeechPitch(payload.params.pitch);
      if (payload.params.volume !== undefined) utter.volume = payload.params.volume;
      utter.onend = () => resolve(result);
      utter.onerror = () => resolve(result); // never reject — graceful fallback
      synth.speak(utter);
    });
  }
}

function defaultLogMissing(engine: string, missing: string[]): void {
  if (typeof console !== 'undefined') {
    console.info(`[prosody] engine "${engine}" missing capabilities: ${missing.join(', ')} — using fallback.`);
  }
}

const clampRate = (rate: number) => Math.min(2, Math.max(0.5, rate));

// Web Speech pitch is a 0..2 multiplier around 1; map semitone offsets onto it.
function semitonesToWebSpeechPitch(semitones: number): number {
  return Math.min(2, Math.max(0, 1 + semitones * 0.06));
}
