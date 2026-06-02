import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  Mic,
  MicOff,
  Square,
  Volume2,
} from 'lucide-react';
import { cn } from '../../../components/classNames';
import type { ShadowingSegment } from '../types/shadowing.types';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { AudioPlayback } from './AudioPlayback';
import { SegmentResultInline } from './SegmentResultInline';
import { useSpeechRecognition } from '../../../services/useSpeechRecognition';
import { splitVoiceReaderText } from '../../voice-reader/voiceReaderText';

const STATUS_CONFIG = {
  not_started: {
    icon: Circle,
    label: 'Not Started',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    card: '',
  },
  practicing: {
    icon: Mic,
    label: 'Practicing',
    badge: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    card: 'ring-2 ring-indigo-400/40',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    badge: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    card: 'ring-2 ring-green-400/20',
  },
  need_retry: {
    icon: AlertTriangle,
    label: 'Need Retry',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    card: 'ring-2 ring-amber-400/30',
  },
};

const SPEEDS: Array<0.75 | 1 | 1.25> = [0.75, 1, 1.25];

interface ShadowingSegmentCardProps {
  segment: ShadowingSegment;
  isLocked: boolean;
  isAnalyzing: boolean;
  onStartPracticing: (segmentId: string) => void;
  onSubmitAttempt: (
    segmentId: string,
    audioBlob: Blob,
    originalText: string,
    recognizedText: string,
    audioDurationMs?: number
  ) => Promise<void>;
  onRetry: (segmentId: string) => void;
  activeVoiceSegmentId?: string | null;
  canUseVoiceReader?: boolean;
  onReadSentence?: (sentenceId: string, text: string) => void;
}

export const ShadowingSegmentCard = React.forwardRef<
  HTMLDivElement,
  ShadowingSegmentCardProps
>(
  (
    {
      segment,
      isLocked,
      isAnalyzing,
      onStartPracticing,
      onSubmitAttempt,
      onRetry,
      activeVoiceSegmentId,
      canUseVoiceReader,
      onReadSentence,
    },
    ref
  ) => {
    const [playbackSpeed, setPlaybackSpeed] = useState<0.75 | 1 | 1.25>(1);
    const [isRetrying, setIsRetrying] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const sampleAudioRef = useRef<HTMLAudioElement | null>(null);
    const prevAttemptIdRef = useRef<string | undefined>(undefined);
    const lastRecognizedRef = useRef('');
    const lastDurationRef = useRef(0);

    const speech = useSpeechRecognition();
    const sttUnsupported = !speech.isSupported;
    const liveTranscript = speech.transcript + (speech.interimTranscript ? ' ' + speech.interimTranscript : '');

    useEffect(() => {
      lastRecognizedRef.current = liveTranscript;
    }, [liveTranscript]);

    const recorder = useAudioRecorder({ silenceTimeoutMs: 3000 });
    const config = STATUS_CONFIG[segment.status];

    const hasResult = segment.latestAttempt !== undefined;
    const showRecordingUI = !hasResult || isRetrying || segment.status === 'practicing';
    const isActivelyRecording = recorder.status === 'recording';
    const isStopping = recorder.status === 'stopping';
    const sentences = splitVoiceReaderText(segment.text).map((sentence) => ({
      ...sentence,
      id: `${segment.id}:${sentence.id}`,
    }));

    // When a new attempt comes in, stop retry mode
    useEffect(() => {
      const newId = segment.latestAttempt?.id;
      if (newId && newId !== prevAttemptIdRef.current) {
        prevAttemptIdRef.current = newId;
        setIsRetrying(false);
        recorder.reset();
        speech.reset();
        lastRecognizedRef.current = '';
      }
    }, [segment.latestAttempt?.id]);

    // Capture latest duration while recording so we can submit it after stop
    useEffect(() => {
      if (recorder.status === 'recording' || recorder.status === 'stopping') {
        lastDurationRef.current = recorder.durationMs;
      }
    }, [recorder.durationMs, recorder.status]);

    // Auto-submit when recording stops with audio
    useEffect(() => {
      if (recorder.status === 'stopped' && recorder.audioBlob) {
        speech.stop();
        setSubmitError(null);
        onSubmitAttempt(
          segment.id,
          recorder.audioBlob,
          segment.text,
          lastRecognizedRef.current,
          lastDurationRef.current || undefined
        ).catch(() => setSubmitError('Analysis failed. Please try again.'));
      }
    }, [recorder.status]);

    // Sync sample audio playback speed
    useEffect(() => {
      if (sampleAudioRef.current) {
        sampleAudioRef.current.playbackRate = playbackSpeed;
      }
    }, [playbackSpeed]);

    const handleStartRecording = async () => {
      setSubmitError(null);
      speech.reset();
      lastRecognizedRef.current = '';
      lastDurationRef.current = 0;
      onStartPracticing(segment.id);
      await recorder.startRecording();
      speech.start();
    };

    const handleStopRecording = () => {
      speech.stop();
      recorder.stopRecording();
    };

    const handleRetry = () => {
      setIsRetrying(true);
      setSubmitError(null);
      speech.reset();
      lastRecognizedRef.current = '';
      recorder.reset();
      onRetry(segment.id);
    };

    const formatDuration = (ms: number) => {
      const s = Math.floor(ms / 1000);
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };

    return (
      <div
        ref={ref}
        id={segment.id}
        className={cn(
          'glass-card rounded-3xl p-5 transition-all duration-300',
          config.card
        )}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0">
              {segment.order}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {segment.type.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAnalyzing && (
              <span className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing…
              </span>
            )}
            <span
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                config.badge
              )}
            >
              <config.icon className="w-3 h-3" />
              {segment.latestAttempt && !isAnalyzing
                ? `${segment.latestAttempt.finalScore}/100`
                : config.label}
            </span>
          </div>
        </div>

        {/* Segment text */}
        <div className="space-y-2 mb-5">
          {sentences.map((sentence) => {
            const isActiveSentence = activeVoiceSegmentId === sentence.id || activeVoiceSegmentId === segment.id;
            return (
              <div
                key={sentence.id}
                className={cn(
                  'flex items-start gap-2 rounded-xl transition-colors',
                  isActiveSentence && 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 px-3 py-2'
                )}
              >
                {onReadSentence && !segment.audioUrl && (
                  <button
                    type="button"
                    onClick={() => onReadSentence(sentence.id, sentence.text)}
                    disabled={!canUseVoiceReader}
                    className="mt-0.5 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-500 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Read this sentence"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <p
                  className={cn(
                    'text-base leading-relaxed',
                    segment.type === 'paragraph'
                      ? 'text-slate-700 dark:text-slate-200'
                      : 'text-slate-800 dark:text-slate-100 font-medium'
                  )}
                >
                  {sentence.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* Sample audio + speed */}
        {segment.audioUrl && (
          <div className="mb-4 flex items-center gap-3">
            <AudioPlayback
              src={segment.audioUrl}
              title="Sample Audio"
              compact
              className="flex-1"
            />
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              {SPEEDS.map(s => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={cn(
                    'px-2 py-1 rounded-lg text-xs font-semibold transition-all',
                    playbackSpeed === s
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recording Controls */}
        {showRecordingUI && !isAnalyzing && (
          <div className="space-y-3">
            {recorder.error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <MicOff className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {recorder.error}
                </p>
              </div>
            )}

            {submitError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {submitError}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Main mic button */}
              {!isActivelyRecording && !isStopping ? (
                <button
                  onClick={handleStartRecording}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all',
                   'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95'
                  )}
                >
                  {recorder.status === 'requesting_permission' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Requesting mic…
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      {isRetrying ? 'Record Again' : 'Start Shadowing'}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  disabled={isStopping}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition-all disabled:opacity-60"
                >
                  {isStopping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Square className="w-4 h-4 fill-current" />
                  )}
                  {isStopping ? 'Stopping…' : 'Stop Recording'}
                </button>
              )}

              {/* Duration + Waveform */}
              {isActivelyRecording && (
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-end gap-0.5 h-8">
                    {[3, 5, 7, 9, 7, 5, 9, 6, 4, 7, 5, 3].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-red-400 rounded-full animate-pulse"
                        style={{
                          height: `${h * 3}px`,
                          animationDelay: `${i * 80}ms`,
                          animationDuration: `${600 + i * 60}ms`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-mono text-red-500 tabular-nums">
                    {formatDuration(recorder.durationMs)}
                  </span>
                  <span className="text-xs text-slate-400">
                    Auto-stops after 3s silence
                  </span>
                </div>
              )}

              {/* Sample audio hint */}
              {!isActivelyRecording && !segment.audioUrl && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  Use the speaker beside each sentence
                </span>
              )}
            </div>

            {/* Live transcript while recording */}
            {(isActivelyRecording || isStopping) && !sttUnsupported && (
              <div className="px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                    Live transcript
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-indigo-900 dark:text-indigo-100 italic min-h-[1.25rem]">
                  {liveTranscript || (
                    <span className="text-indigo-400/70 not-italic">
                      Listening… start speaking
                    </span>
                  )}
                </p>
              </div>
            )}

            {(isActivelyRecording || isStopping) && sttUnsupported && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Live transcript unavailable: this browser doesn't support Speech
                Recognition. Audio is still being recorded.
              </p>
            )}

            {isLocked && (
              <p className="text-xs text-slate-400 text-center">
                Finish recording the active segment first
              </p>
            )}
          </div>
        )}

        {/* Analyzing skeleton */}
        {isAnalyzing && (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2" />
          </div>
        )}

        {/* Inline result */}
        {hasResult && segment.latestAttempt && !isRetrying && (
          <SegmentResultInline
            attempt={segment.latestAttempt}
            onRecordAgain={handleRetry}
            defaultExpanded={segment.status === 'need_retry'}
          />
        )}
      </div>
    );
  }
);

ShadowingSegmentCard.displayName = 'ShadowingSegmentCard';
