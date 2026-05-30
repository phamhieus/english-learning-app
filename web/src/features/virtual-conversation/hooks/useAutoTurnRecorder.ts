import { useCallback, useEffect, useRef } from "react";
import { calculateRMS, calibrateNoiseFloor } from "../utils/audioLevel";
import { getMediaRecorderOptions, getSupportedMimeType } from "../utils/mediaRecorderSupport";
import type {
  ConversationState,
  RecorderConfig,
  AutoTurnRecorderCallbacks,
  DEFAULT_RECORDER_CONFIG,
} from "../types/virtualConversation.types";

type Config = typeof DEFAULT_RECORDER_CONFIG;

interface UseAutoTurnRecorderOptions {
  config: Config;
  callbacks: AutoTurnRecorderCallbacks;
}

interface UseAutoTurnRecorderReturn {
  startListening: () => Promise<void>;
  stopAll: () => void;
}

export function useAutoTurnRecorder({
  config,
  callbacks,
}: UseAutoTurnRecorderOptions): UseAutoTurnRecorderReturn {
  // All mutable state lives in refs so closures always see current values
  // without triggering re-renders inside the hook internals.
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stateRef = useRef<ConversationState>("idle");
  const noiseFloorRef = useRef<number>(0.01);
  const speechStartTimeRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceElapsedRef = useRef<number>(0);
  const maxRecordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  // Guards against MediaRecorder.onstop firing multiple times (browser quirk).
  const stopHandledRef = useRef(false);
  // True once stopAll() is called — prevents auto-restart after AI response.
  const conversationStoppedRef = useRef(false);

  const { onTurnReady, onStateChange, onAudioLevel, onSilenceCountdown, onError } = callbacks;

  const setState = useCallback(
    (s: ConversationState) => {
      stateRef.current = s;
      onStateChange(s);
    },
    [onStateChange]
  );

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current !== null) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    silenceElapsedRef.current = 0;
  };

  const clearMaxTimer = () => {
    if (maxRecordTimerRef.current !== null) {
      clearTimeout(maxRecordTimerRef.current);
      maxRecordTimerRef.current = null;
    }
  };

  const stopRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  /** Fully release all audio resources. */
  const releaseAudio = useCallback(() => {
    stopRaf();
    clearSilenceTimer();
    clearMaxTimer();

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try { recorderRef.current.stop(); } catch { /* ignore */ }
    }
    recorderRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    analyserRef.current = null;
    chunksRef.current = [];
  }, []);

  /** Called when MediaRecorder collects a final Blob — single entry point to send audio. */
  const handleRecordingComplete = useCallback(() => {
    // Guard: only handle once per recording session (onstop can fire twice in Chrome).
    if (stopHandledRef.current) return;
    stopHandledRef.current = true;

    const chunks = [...chunksRef.current];
    chunksRef.current = [];

    if (stateRef.current === "stopped" || conversationStoppedRef.current) return;

    const mimeType = getSupportedMimeType() ?? "audio/webm";
    const blob = new Blob(chunks, { type: mimeType });

    const speechStart = speechStartTimeRef.current;
    const durationMs = speechStart ? Date.now() - speechStart : 0;

    if (durationMs < config.minSpeechMs) {
      onError("I didn't catch that. Please try again.");
      setState("listening");
      return;
    }

    setState("uploading");
    onTurnReady(blob, mimeType, durationMs);
  }, [config.minSpeechMs, onError, onTurnReady, setState]);

  /** Trigger stop — sets "stopping" first to block double-submit, then stops MediaRecorder. */
  const triggerStop = useCallback(() => {
    if (
      stateRef.current === "stopping" ||
      stateRef.current === "uploading" ||
      stateRef.current === "aiThinking" ||
      stateRef.current === "stopped"
    ) return;

    clearSilenceTimer();
    clearMaxTimer();
    stopRaf();
    setState("stopping");
    stopHandledRef.current = false;

    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop(); // onstop → handleRecordingComplete
    } else {
      handleRecordingComplete();
    }
  }, [handleRecordingComplete, setState]);

  /** Starts the silence countdown. Cancels if user speaks again. */
  const startSilenceCountdown = useCallback(() => {
    if (stateRef.current !== "speaking" && stateRef.current !== "silenceCounting") return;

    setState("silenceCounting");
    silenceElapsedRef.current = 0;

    silenceTimerRef.current = setInterval(() => {
      silenceElapsedRef.current += 100;
      onSilenceCountdown(config.silenceMs - silenceElapsedRef.current);

      if (silenceElapsedRef.current >= config.silenceMs) {
        clearSilenceTimer();
        triggerStop();
      }
    }, 100);
  }, [config.silenceMs, onSilenceCountdown, setState, triggerStop]);

  /** rAF loop: reads RMS, updates audio level, drives speaking/silence state machine. */
  const startAnalysisLoop = useCallback(
    (analyser: AnalyserNode) => {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const noiseFloor = noiseFloorRef.current;
      const speakingThreshold = noiseFloor * config.speakingThresholdMultiplier;
      const silenceThreshold = noiseFloor * config.silenceThresholdMultiplier;

      const tick = () => {
        if (stateRef.current === "stopped" || stateRef.current === "stopping" || stateRef.current === "uploading") return;

        analyser.getByteTimeDomainData(dataArray);
        const rms = calculateRMS(dataArray);
        onAudioLevel(rms);

        const isSpeaking = rms > speakingThreshold;
        const isSilent = rms < silenceThreshold;

        if (isSpeaking) {
          if (stateRef.current === "listening") {
            // First word detected — begin recording speech
            speechStartTimeRef.current = Date.now();
            setState("speaking");
          }

          if (stateRef.current === "silenceCounting") {
            // User resumed speaking during countdown — cancel it
            clearSilenceTimer();
            setState("speaking");
          }
        } else if (isSilent) {
          if (stateRef.current === "speaking") {
            // User went quiet after speaking — start countdown
            startSilenceCountdown();
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [
      config.speakingThresholdMultiplier,
      config.silenceThresholdMultiplier,
      onAudioLevel,
      setState,
      startSilenceCountdown,
    ]
  );

  /** Public: acquire mic, calibrate, start recording + analysis. */
  const startListening = useCallback(async () => {
    if (conversationStoppedRef.current) return;

    try {
      setState("listening");
      speechStartTimeRef.current = null;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Build AudioContext pipeline for RMS analysis.
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Calibrate noise floor before exposing the hook to voice.
      noiseFloorRef.current = await calibrateNoiseFloor(analyser, config.calibrationMs);

      // Set up MediaRecorder.
      const options = getMediaRecorderOptions();
      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = handleRecordingComplete;

      recorder.start(250); // collect chunks every 250ms

      // Safety: max record duration
      maxRecordTimerRef.current = setTimeout(() => {
        if (stateRef.current === "speaking" || stateRef.current === "silenceCounting") {
          triggerStop();
        }
      }, config.maxRecordMs);

      startAnalysisLoop(analyser);
    } catch (err) {
      releaseAudio();
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone permission is required to practice speaking."
          : "Could not access microphone. Please check your device settings.";
      setState("error");
      onError(msg);
    }
  }, [
    config.calibrationMs,
    config.maxRecordMs,
    handleRecordingComplete,
    onError,
    releaseAudio,
    setState,
    startAnalysisLoop,
    triggerStop,
  ]);

  /** Public: stop everything, mark conversation as ended. */
  const stopAll = useCallback(() => {
    conversationStoppedRef.current = true;
    releaseAudio();
    setState("stopped");
  }, [releaseAudio, setState]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      conversationStoppedRef.current = true;
      releaseAudio();
    };
  }, [releaseAudio]);

  // Allow external code to reset the stopped flag (e.g. start a new conversation).
  const startListeningWrapped = useCallback(async () => {
    conversationStoppedRef.current = false;
    await startListening();
  }, [startListening]);

  return { startListening: startListeningWrapped, stopAll };
}
