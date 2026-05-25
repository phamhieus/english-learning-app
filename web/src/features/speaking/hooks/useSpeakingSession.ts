import { useState, useRef, useEffect, useCallback } from "react";
import type {
  SpeakingAnalysisResult,
  SpeakingPrompt,
  SpeakingSessionStatus,
} from "../types/speaking.types";
import { useMicrophoneRecorder } from "./useMicrophoneRecorder";
import { useWebSpeechRecognition } from "./useWebSpeechRecognition";
import { transcribeWithWhisper } from "../services/whisperSpeakingService";
import { generateMockScore } from "../utils/speakingScoreMock";

export function useSpeakingSession(prompt: SpeakingPrompt, language: "en" | "vi" = "en") {
  const [status, setStatus] = useState<SpeakingSessionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<SpeakingAnalysisResult | null>(null);
  
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    isRecording,
    audioBlob,
    audioUrl,
    error: micError,
    mediaStream,
    durationSeconds,
    startRecording,
    stopRecording,
    resetRecording,
  } = useMicrophoneRecorder();

  const {
    transcript: liveTranscript,
    isListening: isSpeechListening,
    startListening,
    stopListening,
    resetTranscript,
  } = useWebSpeechRecognition(language);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const safeSetStatus = useCallback((newStatus: SpeakingSessionStatus) => {
    if (isMountedRef.current) {
      setStatus(newStatus);
    }
  }, []);

  const safeSetError = useCallback((err: string | null) => {
    if (isMountedRef.current) {
      setError(err);
    }
  }, []);

  const start = useCallback(async () => {
    safeSetError(null);
    setFinalResult(null);
    resetTranscript();
    safeSetStatus("requesting_permission");

    try {
      // 1. Start speech recognition first to establish hardware capture
      startListening();
      
      // 2. Wait 400ms to let browser speech recognition engine stabilize and avoid device sample rate conflicts
      await new Promise((resolve) => setTimeout(resolve, 400));
      
      // 3. Start MediaRecorder
      await startRecording();
      
      safeSetStatus("recording");
    } catch (err: any) {
      safeSetError(err.message || "Không thể bắt đầu ghi âm.");
      safeSetStatus("error");
      stopListening();
    }
  }, [startRecording, startListening, stopListening, resetTranscript, safeSetError, safeSetStatus]);

  const stop = useCallback(async () => {
    if (status !== "recording") return;
    safeSetStatus("stopping");

    try {
      // 1. Stop recording first to safely finalize and output all audio chunks
      const blob = await stopRecording();
      
      // 2. Stop speech recognition after recording is finalized
      stopListening();
      
      safeSetStatus("transcribing_with_whisper");

      abortControllerRef.current = new AbortController();
      
      let transcriptText = "";
      let segments: any[] = [];

      try {
        const transcript = await transcribeWithWhisper({
          audioBlob: blob,
          language,
          mode: prompt.mode,
          targetText: prompt.targetText,
          signal: abortControllerRef.current.signal,
        });
        transcriptText = transcript.text;
        segments = transcript.segments || [];
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.warn("Whisper API failed, falling back to browser live transcript:", err);
        
        // Use live transcript from SpeechRecognition or targetText as fallback
        const fallbackText = liveTranscript || prompt.targetText || "";
        if (!fallbackText.trim()) {
          throw new Error("Không nhận diện được giọng nói. Vui lòng nói rõ hơn và thử lại.");
        }
        transcriptText = fallbackText;
      }

      safeSetStatus("analyzing");
      
      const result = generateMockScore(
        prompt.targetText,
        transcriptText,
        durationSeconds,
        "whisper"
      );

      // Merge transcript data
      result.transcript = {
        text: transcriptText,
        isFinal: true,
        segments,
      };

      if (isMountedRef.current) {
        setFinalResult(result);
        safeSetStatus("completed");
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("Stop session error:", err);
      safeSetError(err.message || "Lỗi xử lý đánh giá phát âm.");
      safeSetStatus("error");
    }
  }, [status, stopListening, stopRecording, prompt, language, durationSeconds, safeSetStatus, safeSetError, liveTranscript]);

  const retry = useCallback(() => {
    resetRecording();
    resetTranscript();
    setFinalResult(null);
    safeSetError(null);
    safeSetStatus("idle");
  }, [resetRecording, resetTranscript, safeSetError, safeSetStatus]);

  const cancel = useCallback(() => {
    resetRecording();
    resetTranscript();
    stopListening();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    safeSetStatus("idle");
  }, [resetRecording, resetTranscript, stopListening, safeSetStatus]);

  useEffect(() => {
    if (micError) {
      safeSetError(micError);
      safeSetStatus("error");
    }
  }, [micError, safeSetError, safeSetStatus]);

  return {
    status,
    audioBlob,
    audioUrl,
    fakeTranscript: liveTranscript, // Re-map to match current UI variables
    finalResult,
    error,
    durationSeconds,
    mediaStream,
    isRecording,
    isFakeRunning: isSpeechListening,
    start,
    stop,
    retry,
    cancel,
  };
}
