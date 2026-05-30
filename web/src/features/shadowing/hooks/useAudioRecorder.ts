import { useCallback, useEffect, useRef, useState } from 'react';

export type RecordingStatus =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'stopping'
  | 'stopped'
  | 'error';

interface UseAudioRecorderOptions {
  silenceTimeoutMs?: number;
}

interface UseAudioRecorderReturn {
  status: RecordingStatus;
  audioBlob: Blob | null;
  blobUrl: string | null;
  durationMs: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  reset: () => void;
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
}

export function useAudioRecorder({
  silenceTimeoutMs = 3000,
}: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceRafRef = useRef<number | null>(null);
  const silenceDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSoundTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancelledRef = useRef(false);
  const prevBlobUrlRef = useRef<string | null>(null);

  const stopSilenceDetection = useCallback(() => {
    if (silenceRafRef.current !== null) {
      cancelAnimationFrame(silenceRafRef.current);
      silenceRafRef.current = null;
    }
    if (silenceDelayRef.current !== null) {
      clearTimeout(silenceDelayRef.current);
      silenceDelayRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const stopDurationCounter = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      setStatus('stopping');
      stopSilenceDetection();
      stopDurationCounter();
      recorder.stop();
    }
  }, [stopSilenceDetection, stopDurationCounter]);

  const startRecording = useCallback(async () => {
    if (status === 'recording' || status === 'requesting_permission') return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Audio recording is not supported in this browser.');
      setStatus('error');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      setError('MediaRecorder is not supported in this browser.');
      setStatus('error');
      return;
    }

    isCancelledRef.current = false;
    chunksRef.current = [];
    setError(null);
    setAudioBlob(null);
    setDurationMs(0);

    if (prevBlobUrlRef.current) {
      URL.revokeObjectURL(prevBlobUrlRef.current);
      prevBlobUrlRef.current = null;
    }
    setBlobUrl(null);
    setStatus('requesting_permission');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      if (isCancelledRef.current) return;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission denied')) {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError('Failed to access microphone. Please try again.');
      }
      setStatus('error');
      return;
    }

    if (isCancelledRef.current) {
      stream.getTracks().forEach(t => t.stop());
      return;
    }

    streamRef.current = stream;

    const mimeType = getSupportedMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    } catch {
      setError('Failed to initialize recorder. Please try a different browser.');
      setStatus('error');
      stopStream();
      return;
    }

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      if (isCancelledRef.current) return;
      const blob = new Blob(chunksRef.current, {
        type: mimeType || 'audio/webm',
      });
      const url = URL.createObjectURL(blob);
      prevBlobUrlRef.current = url;
      setAudioBlob(blob);
      setBlobUrl(url);
      setDurationMs(Date.now() - startTimeRef.current);
      setStatus('stopped');
      stopStream();
    };

    recorder.onerror = () => {
      if (isCancelledRef.current) return;
      setError('Recording failed unexpectedly. Please try again.');
      setStatus('error');
      stopSilenceDetection();
      stopDurationCounter();
      stopStream();
    };

    recorder.start(100);
    startTimeRef.current = Date.now();
    setStatus('recording');

    durationIntervalRef.current = setInterval(() => {
      setDurationMs(Date.now() - startTimeRef.current);
    }, 300);

    // Silence detection — wait 1.5s before activating
    try {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      const data = new Float32Array(analyser.fftSize);
      lastSoundTimeRef.current = Date.now();

      silenceDelayRef.current = setTimeout(() => {
        const checkSilence = () => {
          if (
            !mediaRecorderRef.current ||
            mediaRecorderRef.current.state !== 'recording'
          )
            return;

          analyser.getFloatTimeDomainData(data);
          const rms = Math.sqrt(
            data.reduce((sum, v) => sum + v * v, 0) / data.length
          );

          if (rms > 0.008) lastSoundTimeRef.current = Date.now();

          if (Date.now() - lastSoundTimeRef.current > silenceTimeoutMs) {
            stopRecording();
            return;
          }

          silenceRafRef.current = requestAnimationFrame(checkSilence);
        };
        silenceRafRef.current = requestAnimationFrame(checkSilence);
      }, 1500);
    } catch {
      // Silence detection unavailable — recording continues manually
    }
  }, [status, silenceTimeoutMs, stopRecording, stopSilenceDetection, stopDurationCounter, stopStream]);

  const cancelRecording = useCallback(() => {
    isCancelledRef.current = true;
    stopSilenceDetection();
    stopDurationCounter();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    stopStream();
    setStatus('idle');
    setAudioBlob(null);
    setBlobUrl(null);
    setDurationMs(0);
  }, [stopSilenceDetection, stopDurationCounter, stopStream]);

  const reset = useCallback(() => {
    cancelRecording();
    setError(null);
    isCancelledRef.current = false;
  }, [cancelRecording]);

  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      stopSilenceDetection();
      stopDurationCounter();
      stopStream();
      if (prevBlobUrlRef.current) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
      }
    };
  }, [stopSilenceDetection, stopDurationCounter, stopStream]);

  return {
    status,
    audioBlob,
    blobUrl,
    durationMs,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  };
}
