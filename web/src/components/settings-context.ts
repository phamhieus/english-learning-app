import { createContext } from 'react';

export type AIProvider = 'gemini' | 'openai' | 'deepseek';
export type PrimaryExam = 'TOEIC' | 'IELTS';

export interface AppSettings {
  aiProvider: AIProvider;
  primaryExam: PrimaryExam;
  geminiKey: string;
  openAiKey: string;
  deepseekKey: string;
  textModel: string;
}

export interface SettingsContextType extends AppSettings {
  setAiProvider: (provider: AIProvider) => void;
  setPrimaryExam: (exam: PrimaryExam) => void;
  setGeminiKey: (key: string) => void;
  setOpenAiKey: (key: string) => void;
  setDeepseekKey: (key: string) => void;
  setTextModel: (model: string) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
