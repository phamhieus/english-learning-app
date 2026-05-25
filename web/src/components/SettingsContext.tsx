import React, { createContext, useContext, useState, useEffect } from 'react';

export type AIProvider = 'gemini' | 'openai' | 'deepseek';

export interface AppSettings {
  aiProvider: AIProvider;
  geminiKey: string;
  openAiKey: string;
  deepseekKey: string;
  textModel: string;
}

interface SettingsContextType extends AppSettings {
  setAiProvider: (provider: AIProvider) => void;
  setGeminiKey: (key: string) => void;
  setOpenAiKey: (key: string) => void;
  setDeepseekKey: (key: string) => void;
  setTextModel: (model: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Migrate existing apiKey to geminiKey if needed
  const legacyKey = localStorage.getItem('apiKey') || '';
  
  const [aiProvider, setAiProvider] = useState<AIProvider>((localStorage.getItem('aiProvider') as AIProvider) || 'gemini');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('geminiKey') || legacyKey);
  const [openAiKey, setOpenAiKey] = useState(localStorage.getItem('openAiKey') || '');
  const [deepseekKey, setDeepseekKey] = useState(localStorage.getItem('deepseekKey') || '');
  const [textModel, setTextModel] = useState(localStorage.getItem('textModel') || 'gemini-2.0-flash');

  useEffect(() => {
    localStorage.setItem('aiProvider', aiProvider);
    localStorage.setItem('geminiKey', geminiKey);
    localStorage.setItem('openAiKey', openAiKey);
    localStorage.setItem('deepseekKey', deepseekKey);
    localStorage.setItem('textModel', textModel);
  }, [aiProvider, geminiKey, openAiKey, deepseekKey, textModel]);

  return (
    <SettingsContext.Provider value={{ 
      aiProvider, setAiProvider,
      geminiKey, setGeminiKey,
      openAiKey, setOpenAiKey,
      deepseekKey, setDeepseekKey,
      textModel, setTextModel
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
