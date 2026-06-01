// Local text-to-speech for hearing a segment's English before shadowing.
// Uses the browser's built-in SpeechSynthesis (Web Speech API) — no cloud, no
// network. Useful when a lesson has no matching original audio (e.g. curated
// VOA entries playing placeholder video).

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTextToSpeech {
  supported: boolean;
  speaking: boolean;
  speak: (text: string, rate?: number) => void;
  cancel: () => void;
}

export function useTextToSpeech(): UseTextToSpeech {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!supported) return;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => /^en[-_]?US/i.test(v.lang)) ??
        voices.find((v) => v.lang.toLowerCase().startsWith('en')) ??
        null;
    };
    pickVoice();
    // Voices often load asynchronously.
    window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', pickVoice);
  }, [supported]);

  const speak = useCallback(
    (text: string, rate = 1) => {
      if (!supported || !text.trim()) return;
      window.speechSynthesis.cancel(); // stop anything in flight
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = voiceRef.current?.lang ?? 'en-US';
      if (voiceRef.current) utter.voice = voiceRef.current;
      utter.rate = Math.min(2, Math.max(0.5, rate));
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
    },
    [supported],
  );

  const cancel = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  // Stop speaking if the component unmounts.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { supported, speaking, speak, cancel };
}
