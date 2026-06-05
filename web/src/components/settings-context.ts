import { createContext } from 'react';

export type AIProvider = 'gemini' | 'openai' | 'deepseek' | 'grok' | 'qwen' | 'moonshot' | 'zhipu';
export type PrimaryExam = 'TOEIC' | 'IELTS';
export type VoiceReaderLanguage = 'en-US' | 'en-GB';
export type VoiceReaderSpeed = 0.75 | 1 | 1.25;
export type VoiceReaderRepeat = 1 | 2 | 3;
export type VoiceReaderGapMs = 400 | 500 | 600 | 800 | 1000 | 2500 | 3000;
export type VoiceReaderGender = 'auto' | 'female' | 'male';

export interface UserAudioSettings {
  isVoiceReaderEnabled: boolean;
  language: VoiceReaderLanguage;
  preferredVoiceName?: string;
  voiceGender: VoiceReaderGender;
  speed: VoiceReaderSpeed;
  pitch: number;
  dialogueGapMs: VoiceReaderGapMs;
  shadowingGapMs: VoiceReaderGapMs;
  repeatEachLine: VoiceReaderRepeat;
}

export interface AppSettings {
  aiProvider: AIProvider;
  primaryExam: PrimaryExam;
  geminiKey: string;
  openAiKey: string;
  deepseekKey: string;
  grokKey: string;
  qwenKey: string;
  moonshotKey: string;
  zhipuKey: string;
  textModel: string;
  userAudioSettings: UserAudioSettings;
}

export interface SettingsContextType extends AppSettings {
  setAiProvider: (provider: AIProvider) => void;
  setPrimaryExam: (exam: PrimaryExam) => void;
  setGeminiKey: (key: string) => void;
  setOpenAiKey: (key: string) => void;
  setDeepseekKey: (key: string) => void;
  setGrokKey: (key: string) => void;
  setQwenKey: (key: string) => void;
  setMoonshotKey: (key: string) => void;
  setZhipuKey: (key: string) => void;
  setTextModel: (model: string) => void;
  setUserAudioSettings: (patch: Partial<UserAudioSettings>) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Which AppSettings field holds each provider's API key.
export const PROVIDER_KEY_FIELD: Record<AIProvider, keyof AppSettings> = {
  gemini: 'geminiKey',
  openai: 'openAiKey',
  deepseek: 'deepseekKey',
  grok: 'grokKey',
  qwen: 'qwenKey',
  moonshot: 'moonshotKey',
  zhipu: 'zhipuKey',
};

// Human-readable provider names for UI copy.
export const PROVIDER_LABEL: Record<AIProvider, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  deepseek: 'DeepSeek',
  grok: 'xAI (Grok)',
  qwen: 'Qwen',
  moonshot: 'Moonshot (Kimi)',
  zhipu: 'Zhipu (GLM)',
};

/** True when the active provider has an API key configured. */
export function hasApiKey(settings: AppSettings): boolean {
  return !!settings[PROVIDER_KEY_FIELD[settings.aiProvider]];
}
