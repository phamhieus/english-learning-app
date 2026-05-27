import { createContext } from 'react';

export type AIProvider = 'gemini' | 'openai' | 'deepseek';

export interface AppSettings {
  aiProvider: AIProvider;
  geminiKey: string;
  openAiKey: string;
  deepseekKey: string;
  textModel: string;
}

export interface SettingsContextType extends AppSettings {
  setAiProvider: (provider: AIProvider) => void;
  setGeminiKey: (key: string) => void;
  setOpenAiKey: (key: string) => void;
  setDeepseekKey: (key: string) => void;
  setTextModel: (model: string) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
