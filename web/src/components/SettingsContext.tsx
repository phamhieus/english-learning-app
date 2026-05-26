import React, { useState, useEffect } from 'react';
import { SettingsContext, type AIProvider } from './settings-context';

export type { AIProvider, AppSettings } from './settings-context';

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
