import { useState, useRef, useCallback } from "react";
import type { SpeakingMode } from "../types/speaking.types";
import { buildFakeTranscriptWords } from "../utils/fakeTranscriptBuilder";

interface UseFakeRealtimeTranscriptOptions {
  targetText?: string;
  mode: SpeakingMode;
  enabled: boolean;
  minStepDelayMs?: number;
  maxStepDelayMs?: number;
}

const PLACEHOLDERS = [
  "Đang nghe...",
  "Đang ghi nhận câu trả lời...",
  "Tiếp tục nói, Whisper sẽ xử lý sau khi bạn bấm Stop...",
];

export function useFakeRealtimeTranscript(options: UseFakeRealtimeTranscriptOptions) {
  const [previewText, setPreviewText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<any>(null);
  const placeholderIndexRef = useRef(0);
  const wordsRef = useRef<string[]>([]);
  const currentWordIndexRef = useRef(0);

  const { targetText, minStepDelayMs = 300, maxStepDelayMs = 700 } = options;

  const startFakeTranscript = useCallback(() => {
    if (!options.enabled) return;
    setIsRunning(true);
    setPreviewText("");
    
    if (timerRef.current) clearTimeout(timerRef.current);

    if (targetText) {
      wordsRef.current = buildFakeTranscriptWords(targetText);
      currentWordIndexRef.current = 0;
      scheduleNextWordReveal();
    } else {
      placeholderIndexRef.current = 0;
      setPreviewText(PLACEHOLDERS[0]);
      scheduleNextPlaceholder();
    }
  }, [options.enabled, targetText]);

  const scheduleNextWordReveal = () => {
    const delay = Math.floor(Math.random() * (maxStepDelayMs - minStepDelayMs + 1)) + minStepDelayMs;
    timerRef.current = setTimeout(() => {
      const words = wordsRef.current;
      let currentIndex = currentWordIndexRef.current;
      
      if (currentIndex < words.length) {
        // Reveal 1 to 3 words
        const wordsToReveal = Math.floor(Math.random() * 3) + 1;
        currentIndex = Math.min(currentIndex + wordsToReveal, words.length);
        currentWordIndexRef.current = currentIndex;
        
        setPreviewText(words.slice(0, currentIndex).join(" "));
        
        if (currentIndex < words.length) {
          scheduleNextWordReveal();
        }
      }
    }, delay);
  };

  const scheduleNextPlaceholder = () => {
    timerRef.current = setTimeout(() => {
      placeholderIndexRef.current = (placeholderIndexRef.current + 1) % PLACEHOLDERS.length;
      setPreviewText(PLACEHOLDERS[placeholderIndexRef.current]);
      scheduleNextPlaceholder();
    }, 3000); // Change placeholder every 3 seconds
  };

  const stopFakeTranscript = useCallback(() => {
    setIsRunning(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetFakeTranscript = useCallback(() => {
    stopFakeTranscript();
    setPreviewText("");
  }, [stopFakeTranscript]);

  return {
    previewText,
    isRunning,
    startFakeTranscript,
    stopFakeTranscript,
    resetFakeTranscript,
  };
}
