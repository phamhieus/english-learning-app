import { createContext } from 'react';

export type AIProvider = 'gemini' | 'openai' | 'deepseek';
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
  textModel: string;
  userAudioSettings: UserAudioSettings;
}

export interface SettingsContextType extends AppSettings {
  setAiProvider: (provider: AIProvider) => void;
  setPrimaryExam: (exam: PrimaryExam) => void;
  setGeminiKey: (key: string) => void;
  setOpenAiKey: (key: string) => void;
  setDeepseekKey: (key: string) => void;
  setTextModel: (model: string) => void;
  setUserAudioSettings: (patch: Partial<UserAudioSettings>) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
