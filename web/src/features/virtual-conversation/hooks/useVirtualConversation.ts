import { useCallback, useEffect, useRef, useState } from "react";
import { useAutoTurnRecorder } from "./useAutoTurnRecorder";
import { sendConversationTurn, clearConversationSession } from "../services/virtualConversationApi";
import { DEFAULT_RECORDER_CONFIG } from "../types/virtualConversation.types";
import type {
  ConversationState,
  ConversationTurn,
  ConversationTurnResponse,
  ConversationScenario,
  ConversationLevel,
} from "../types/virtualConversation.types";
import { useSpeechRecognition } from "../../../services/useSpeechRecognition";
import type { AppSettings } from "../../../components/settings-context";

interface UseVirtualConversationOptions {
  scenario: ConversationScenario;
  settings: AppSettings;
}

export interface UseVirtualConversationReturn {
  conversationState: ConversationState;
  turns: ConversationTurn[];
  audioLevel: number;
  silenceCountdownMs: number;
  errorMessage: string | null;
  startConversation: () => void;
  stopConversation: () => void;
  retryTurn: () => void;
  cancelSending: () => void;
}

export function useVirtualConversation({
  scenario,
  settings,
}: UseVirtualConversationOptions): UseVirtualConversationReturn {
  const [conversationState, setConversationState] = useState<ConversationState>("idle");
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [silenceCountdownMs, setSilenceCountdownMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const conversationIdRef = useRef(`conv-${Date.now()}`);
  const turnIndexRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeTurnIdRef = useRef<string | null>(null);
  const stoppedRef = useRef(false);

  const speech = useSpeechRecognition();
  const transcriptRef = useRef("");

  useEffect(() => {
    transcriptRef.current = speech.transcript;
  }, [speech.transcript]);

  // Snapshot refs — always current, no stale closure risk.
  const turnsRef = useRef<ConversationTurn[]>([]);
  const settingsRef = useRef(settings);
  const scenarioRef = useRef(scenario);
  settingsRef.current = settings;
  scenarioRef.current = scenario;

  // Break circular dep: recorder → onTurnReady → restart → recorder.startListening.
  // We write the restart fn into this ref after recorder is created.
  const restartListeningRef = useRef<() => void>(() => undefined);

  const syncTurns = (updater: (prev: ConversationTurn[]) => ConversationTurn[]) => {
    setTurns((prev) => {
      const next = updater(prev);
      turnsRef.current = next;
      return next;
    });
  };

  const stopSpeech = useCallback(() => {
    speech.stop();
  }, [speech]);

  const startSpeech = useCallback(() => {
    transcriptRef.current = "";
    speech.start();
  }, [speech]);

  const handleError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setConversationState("error");
  }, []);

  // onTurnReady: single entry point when audio is ready to process.
  const handleTurnReady = useCallback(
    async (audioBlob: Blob, mimeType: string) => {
      if (stoppedRef.current) return;

      stopSpeech();
      const transcript = transcriptRef.current;
      transcriptRef.current = "";

      const turnIndex = turnIndexRef.current;
      const turnId = `${conversationIdRef.current}-${turnIndex}`;
      activeTurnIdRef.current = turnId;
      turnIndexRef.current += 1;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setConversationState("aiThinking");
      setErrorMessage(null);

      try {
        const response: ConversationTurnResponse = await sendConversationTurn(
          settingsRef.current,
          {
            conversationId: conversationIdRef.current,
            scenarioId: scenarioRef.current.id,
            turnIndex,
            audioBlob,
            mimeType,
            transcript,
            conversationHistory: turnsRef.current,
            level: scenarioRef.current.level as ConversationLevel,
            abortSignal: controller.signal,
          }
        );

        // Discard stale responses from aborted turns.
        if (activeTurnIdRef.current !== turnId || stoppedRef.current) return;

        syncTurns((prev) => [
          ...prev,
          {
            id: `user-${turnId}`,
            turnIndex,
            role: "user" as const,
            text: response.transcript || transcript || "(no transcript)",
            correctedText: response.correctedText,
            feedback: response.feedback,
            timestamp: Date.now(),
          },
          {
            id: `ai-${turnId}`,
            turnIndex,
            role: "ai" as const,
            text: response.aiReply,
            timestamp: Date.now(),
          },
        ]);

        if (!stoppedRef.current) {
          setConversationState("aiSpeaking");
          // Delay mic restart to prevent capturing TTS playback.
          setTimeout(() => {
            if (!stoppedRef.current) restartListeningRef.current();
          }, 400);
        }
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return;
        handleError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    },
    [stopSpeech, handleError]
  );

  const recorder = useAutoTurnRecorder({
    config: DEFAULT_RECORDER_CONFIG,
    callbacks: {
      onTurnReady: handleTurnReady,
      onStateChange: setConversationState,
      onAudioLevel: setAudioLevel,
      onSilenceCountdown: setSilenceCountdownMs,
      onError: handleError,
    },
  });

  // Keep restart ref up to date every render — reads latest recorder.startListening.
  restartListeningRef.current = () => {
    transcriptRef.current = "";
    startSpeech();
    recorder.startListening();
  };

  const startConversation = useCallback(() => {
    stoppedRef.current = false;
    conversationIdRef.current = `conv-${Date.now()}`;
    turnIndexRef.current = 0;
    const opening: ConversationTurn = {
      id: "ai-opening",
      turnIndex: -1,
      role: "ai",
      text: scenarioRef.current.openingLine,
      timestamp: Date.now(),
    };
    turnsRef.current = [opening];
    setTurns([opening]);
    setErrorMessage(null);
    restartListeningRef.current();
  }, []);

  const stopConversation = useCallback(() => {
    stoppedRef.current = true;
    abortControllerRef.current?.abort();
    stopSpeech();
    recorder.stopAll();
    clearConversationSession(conversationIdRef.current);
    setConversationState("stopped");
  }, [recorder, stopSpeech]);

  const retryTurn = useCallback(() => {
    if (stoppedRef.current) return;
    abortControllerRef.current?.abort();
    setErrorMessage(null);
    restartListeningRef.current();
  }, []);

  const cancelSending = useCallback(() => {
    if (stoppedRef.current) return;
    abortControllerRef.current?.abort();
    setErrorMessage(null);
    restartListeningRef.current();
  }, []);

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      stopSpeech();
      clearConversationSession(conversationIdRef.current);
    };
  }, [stopSpeech]);

  return {
    conversationState,
    turns,
    audioLevel,
    silenceCountdownMs,
    errorMessage,
    startConversation,
    stopConversation,
    retryTurn,
    cancelSending,
  };
}
