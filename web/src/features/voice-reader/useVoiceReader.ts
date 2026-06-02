import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '../../components/useSettings';
import type { VoiceReaderSegment } from './voiceReaderText';

export type VoiceReaderStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';
export type VoiceReaderMode = 'single' | 'sequence' | 'dialogue' | 'shadowing';

interface SpeakOptions {
  mode?: VoiceReaderMode;
  gapMs?: number;
  repeatEachLine?: number;
}

interface UseVoiceReaderOptions {
  exerciseId: string;
}

export function useVoiceReader({ exerciseId }: UseVoiceReaderOptions) {
  const { userAudioSettings } = useSettings();
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [isTemporarilyMuted, setMuted] = useState(false);
  const [status, setStatus] = useState<VoiceReaderStatus>('idle');
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastPlaybackMode, setLastPlaybackMode] = useState<VoiceReaderMode>('single');

  const sessionIdRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const lastSegmentsRef = useRef<VoiceReaderSegment[]>([]);
  const lastOptionsRef = useRef<SpeakOptions>({});

  const globalVoiceReaderEnabled = userAudioSettings.isVoiceReaderEnabled;
  const canPlayAudio = supported && globalVoiceReaderEnabled && !isTemporarilyMuted;

  const clearGap = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    sessionIdRef.current += 1;
    clearGap();
    if (supported) window.speechSynthesis.cancel();
    setStatus('idle');
    setActiveSegmentId(null);
    setActiveSegmentIndex(null);
  }, [clearGap, supported]);

  const pause = useCallback(() => {
    if (!supported || !window.speechSynthesis.speaking) return;
    window.speechSynthesis.pause();
    setStatus('paused');
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setStatus('playing');
  }, [supported]);

  const getVoice = useCallback(() => {
    if (!supported) return null;
    const voices = window.speechSynthesis.getVoices();
    const preferred = userAudioSettings.preferredVoiceName
      ? voices.find((voice) => voice.name === userAudioSettings.preferredVoiceName)
      : null;
    const target = userAudioSettings.language.toLowerCase();
    const normalize = (lang: string) => lang.toLowerCase().replace('_', '-');
    const accentHint = userAudioSettings.language === 'en-GB' ? /\b(uk|gb|british|england)\b/i : /\b(us|usa|american)\b/i;
    const accentVoices = voices.filter(
      (voice) =>
        normalize(voice.lang) === target ||
        normalize(voice.lang).startsWith(`${target}-`) ||
        (normalize(voice.lang).startsWith('en') && accentHint.test(voice.name)),
    );
    const genderVoice =
      findVoiceByGender(accentVoices, userAudioSettings.voiceGender, normalize) ??
      findVoiceByGender(voices, userAudioSettings.voiceGender, normalize);
    return (
      preferred ??
      genderVoice ??
      voices.find((voice) => normalize(voice.lang) === target) ??
      voices.find((voice) => normalize(voice.lang).startsWith(`${target}-`)) ??
      voices.find((voice) => normalize(voice.lang).startsWith('en') && accentHint.test(voice.name)) ??
      voices.find((voice) => normalize(voice.lang).startsWith('en')) ??
      null
    );
  }, [supported, userAudioSettings.language, userAudioSettings.preferredVoiceName, userAudioSettings.voiceGender]);

  const speakSegments = useCallback(
    (segments: VoiceReaderSegment[], options: SpeakOptions = {}) => {
      const readable = segments.filter((segment) => segment.text.trim());
      if (!canPlayAudio || readable.length === 0) return false;

      stop();
      const sessionId = sessionIdRef.current;
      const mode = options.mode ?? 'sequence';
      const repeatEachLine = Math.max(1, options.repeatEachLine ?? 1);
      const gapMs = Math.max(0, options.gapMs ?? 0);
      const voice = getVoice();

      lastSegmentsRef.current = readable;
      lastOptionsRef.current = options;
      setLastPlaybackMode(mode);
      setErrorMessage(null);
      setStatus('loading');

      const speakAt = (segmentIndex: number, repeatIndex = 0) => {
        if (sessionId !== sessionIdRef.current || !canPlayAudio) return;
        const segment = readable[segmentIndex];
        if (!segment) {
          setStatus('completed');
          setActiveSegmentId(null);
          setActiveSegmentIndex(null);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(segment.text);
        utterance.lang = userAudioSettings.language;
        utterance.rate = userAudioSettings.speed;
        utterance.pitch = userAudioSettings.pitch;
        if (voice) utterance.voice = voice;

        utterance.onstart = () => {
          if (sessionId !== sessionIdRef.current) return;
          setStatus('playing');
          setActiveSegmentId(segment.id);
          setActiveSegmentIndex(segmentIndex);
        };

        utterance.onend = () => {
          if (sessionId !== sessionIdRef.current || !canPlayAudio) return;
          const shouldRepeat = repeatIndex + 1 < repeatEachLine;
          const nextSegmentIndex = shouldRepeat ? segmentIndex : segmentIndex + 1;
          const nextRepeatIndex = shouldRepeat ? repeatIndex + 1 : 0;
          clearGap();
          timeoutRef.current = window.setTimeout(() => speakAt(nextSegmentIndex, nextRepeatIndex), gapMs);
        };

        utterance.onerror = () => {
          if (sessionId !== sessionIdRef.current) return;
          setStatus('error');
          setErrorMessage('Voice Reader could not play this text.');
          setActiveSegmentId(null);
          setActiveSegmentIndex(null);
        };

        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          setStatus('error');
          setErrorMessage('Voice Reader could not start on this device.');
        }
      };

      speakAt(0);
      return true;
    },
    [
      canPlayAudio,
      clearGap,
      getVoice,
      stop,
      userAudioSettings.language,
      userAudioSettings.pitch,
      userAudioSettings.speed,
    ],
  );

  const replay = useCallback(() => {
    return speakSegments(lastSegmentsRef.current, lastOptionsRef.current);
  }, [speakSegments]);

  const setTemporarilyMuted = useCallback(
    (next: boolean) => {
      setMuted(next);
      if (next) stop();
    },
    [stop],
  );

  useEffect(() => {
    setMuted(false);
    stop();
    setErrorMessage(null);
  }, [exerciseId]);

  useEffect(() => {
    if (!canPlayAudio) stop();
  }, [canPlayAudio]);

  useEffect(() => stop, [stop]);

  return useMemo(
    () => ({
      supported,
      globalVoiceReaderEnabled,
      isTemporarilyMuted,
      canPlayAudio,
      status,
      activeSegmentId,
      activeSegmentIndex,
      lastPlaybackMode,
      errorMessage,
      setTemporarilyMuted,
      speakSegments,
      pause,
      resume,
      stop,
      replay,
    }),
    [
      activeSegmentId,
      activeSegmentIndex,
      canPlayAudio,
      errorMessage,
      globalVoiceReaderEnabled,
      isTemporarilyMuted,
      lastPlaybackMode,
      pause,
      replay,
      resume,
      setTemporarilyMuted,
      speakSegments,
      status,
      stop,
      supported,
    ],
  );
}

function findVoiceByGender(
  voices: SpeechSynthesisVoice[],
  gender: 'auto' | 'female' | 'male',
  normalize: (lang: string) => string,
) {
  if (gender === 'auto') return null;
  const femaleHint = /\b(female|woman|girl|zira|susan|hazel|samantha|victoria|karen|moira|tessa|serena|aria|jenny|michelle|emma|amy|libby|sonia)\b/i;
  const maleHint = /\b(male|man|boy|david|mark|george|daniel|alex|fred|tom|guy|ryan|brian|christopher|eric|roger)\b/i;
  const hint = gender === 'female' ? femaleHint : maleHint;
  return voices.find((voice) => normalize(voice.lang).startsWith('en') && hint.test(voice.name)) ?? null;
}
