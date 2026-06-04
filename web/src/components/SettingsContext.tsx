import React, { useState, useEffect } from 'react';
import {
  SettingsContext,
  type AIProvider,
  type PrimaryExam,
  type UserAudioSettings,
} from './settings-context';

export type { AIProvider, AppSettings, PrimaryExam, UserAudioSettings } from './settings-context';

const AUDIO_SETTINGS_KEY = 'lingua:user-audio-settings';

const DEFAULT_AUDIO_SETTINGS: UserAudioSettings = {
  isVoiceReaderEnabled: true,
  language: 'en-US',
  preferredVoiceName: undefined,
  voiceGender: 'auto',
  speed: 1,
  pitch: 1,
  dialogueGapMs: 500,
  shadowingGapMs: 2500,
  repeatEachLine: 1,
};

function readAudioSettings(): UserAudioSettings {
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (!raw) return DEFAULT_AUDIO_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UserAudioSettings>;
    return {
      ...DEFAULT_AUDIO_SETTINGS,
      isVoiceReaderEnabled:
        typeof parsed.isVoiceReaderEnabled === 'boolean'
          ? parsed.isVoiceReaderEnabled
          : DEFAULT_AUDIO_SETTINGS.isVoiceReaderEnabled,
      language: parsed.language === 'en-GB' ? 'en-GB' : DEFAULT_AUDIO_SETTINGS.language,
      preferredVoiceName:
        typeof parsed.preferredVoiceName === 'string' ? parsed.preferredVoiceName : undefined,
      voiceGender: parsed.voiceGender === 'female' || parsed.voiceGender === 'male'
        ? parsed.voiceGender
        : DEFAULT_AUDIO_SETTINGS.voiceGender,
      speed: parsed.speed === 0.75 || parsed.speed === 1 || parsed.speed === 1.25
        ? parsed.speed
        : DEFAULT_AUDIO_SETTINGS.speed,
      pitch: typeof parsed.pitch === 'number' ? parsed.pitch : DEFAULT_AUDIO_SETTINGS.pitch,
      dialogueGapMs: parsed.dialogueGapMs === 400 || parsed.dialogueGapMs === 500 || parsed.dialogueGapMs === 800
        ? parsed.dialogueGapMs
        : DEFAULT_AUDIO_SETTINGS.dialogueGapMs,
      shadowingGapMs: parsed.shadowingGapMs === 1000 || parsed.shadowingGapMs === 2500 || parsed.shadowingGapMs === 3000
        ? parsed.shadowingGapMs
        : DEFAULT_AUDIO_SETTINGS.shadowingGapMs,
      repeatEachLine: parsed.repeatEachLine === 1 || parsed.repeatEachLine === 2 || parsed.repeatEachLine === 3
        ? parsed.repeatEachLine
        : DEFAULT_AUDIO_SETTINGS.repeatEachLine,
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [aiProvider, setAiProvider] = useState<AIProvider>((localStorage.getItem('aiProvider') as AIProvider) || 'gemini');
  const [primaryExam, setPrimaryExam] = useState<PrimaryExam>((localStorage.getItem('primaryExam') as PrimaryExam) || 'IELTS');
  const [geminiKey, setGeminiKey] = useState(() => {
    const stored = localStorage.getItem('geminiKey');
    if (stored !== null) return stored;
    // One-time migration from legacy 'apiKey'
    const legacy = localStorage.getItem('apiKey') || '';
    if (legacy) localStorage.removeItem('apiKey');
    return legacy;
  });
  const [openAiKey, setOpenAiKey] = useState(localStorage.getItem('openAiKey') || '');
  const [deepseekKey, setDeepseekKey] = useState(localStorage.getItem('deepseekKey') || '');
  const [textModel, setTextModel] = useState(localStorage.getItem('textModel') || 'gemini-2.0-flash');
  const [userAudioSettings, setAudioSettings] = useState<UserAudioSettings>(readAudioSettings);

  useEffect(() => {
    localStorage.setItem('aiProvider', aiProvider);
    localStorage.setItem('primaryExam', primaryExam);
    localStorage.setItem('geminiKey', geminiKey);
    localStorage.setItem('openAiKey', openAiKey);
    localStorage.setItem('deepseekKey', deepseekKey);
    localStorage.setItem('textModel', textModel);
  }, [aiProvider, primaryExam, geminiKey, openAiKey, deepseekKey, textModel]);

  useEffect(() => {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(userAudioSettings));
  }, [userAudioSettings]);

  const setUserAudioSettings = (patch: Partial<UserAudioSettings>) => {
    setAudioSettings((current) => {
      const next = { ...current, ...patch };
      if (patch.isVoiceReaderEnabled === false) window.speechSynthesis?.cancel();
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{ 
      aiProvider, setAiProvider,
      primaryExam, setPrimaryExam,
      geminiKey, setGeminiKey,
      openAiKey, setOpenAiKey,
      deepseekKey, setDeepseekKey,
      textModel, setTextModel,
      userAudioSettings, setUserAudioSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
}
