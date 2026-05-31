import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSpeechRecognition,
  type SpeechRecognition,
  type SpeechRecognitionEvent,
} from "./speechRecognition";

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxRestarts?: number;
  onResult?: (transcript: string, isFinal: boolean) => void;
}

interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => string;
  reset: () => void;
}

const RESTART_DELAY_MS = 100;

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    lang = "en-US",
    continuous = true,
    interimResults = true,
    maxRestarts = 50,
    onResult,
  } = options;

  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(
    () => !!(window.SpeechRecognition ?? window.webkitSpeechRecognition)
  );

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const restartCountRef = useRef(0);
  const intentionalStopRef = useRef(false);
  const isListeningRef = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
    recognitionRef.current = null;
  }, []);

  const createAndStart = useCallback((): boolean => {
    const recognition = createSpeechRecognition();
    if (!recognition) return false;

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript + " ";
          onResultRef.current?.(result[0].transcript, true);
        } else {
          interim += result[0].transcript;
          onResultRef.current?.(result[0].transcript, false);
        }
      }
      setTranscript(finalTranscriptRef.current.trim());
      setInterimTranscript(interim);
      restartCountRef.current = 0;
    };

    recognition.onerror = (event: Event) => {
      const error = (event as Event & { error?: string }).error ?? "unknown";
      if (error === "no-speech" || error === "audio-capture" || error === "aborted") {
        return;
      }
      console.warn("SpeechRecognition error:", error);
    };

    recognition.onend = () => {
      if (intentionalStopRef.current || !isListeningRef.current) return;

      if (restartCountRef.current < maxRestarts) {
        restartCountRef.current += 1;
        setTimeout(() => {
          if (intentionalStopRef.current || !isListeningRef.current) return;
          stopRecognition();
          if (createAndStart()) {
            // restarted successfully
          } else {
            setIsListening(false);
            isListeningRef.current = false;
          }
        }, RESTART_DELAY_MS);
      } else {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      return true;
    } catch {
      recognitionRef.current = null;
      return false;
    }
  }, [lang, continuous, interimResults, maxRestarts, stopRecognition]);

  const start = useCallback(() => {
    stopRecognition();
    intentionalStopRef.current = false;
    restartCountRef.current = 0;
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");

    if (createAndStart()) {
      setIsListening(true);
      isListeningRef.current = true;
    }
  }, [stopRecognition, createAndStart]);

  const stop = useCallback((): string => {
    intentionalStopRef.current = true;
    isListeningRef.current = false;
    stopRecognition();
    setIsListening(false);
    setInterimTranscript("");
    return finalTranscriptRef.current.trim();
  }, [stopRecognition]);

  const reset = useCallback(() => {
    intentionalStopRef.current = true;
    isListeningRef.current = false;
    stopRecognition();
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setIsListening(false);
  }, [stopRecognition]);

  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;
      isListeningRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    start,
    stop,
    reset,
  };
}
