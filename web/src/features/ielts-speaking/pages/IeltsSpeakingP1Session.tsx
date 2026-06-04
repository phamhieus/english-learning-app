import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useNavigationType } from 'react-router-dom';
import { Mic, ChevronRight, Clock, Volume2 } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { useSpeechRecognition } from '../../../services/useSpeechRecognition';
import { useVoiceReader } from '../../voice-reader/useVoiceReader';
import { makeVoiceReaderSegments } from '../../voice-reader/voiceReaderText';
import type { IeltsSpeakingMode, IeltsSpeakingTopic, IeltsAnswerRecord } from '../types/ielts-speaking.types';

interface SessionInput {
  mode: IeltsSpeakingMode;
  topics: IeltsSpeakingTopic[];
  questionCount: number;
  isMockMode: boolean;
}

type Phase = 'countdown' | 'reading' | 'listening';

interface QueueItem {
  topicName: string;
  questionId: string;
  questionText: string;
}

function buildQueue(topics: IeltsSpeakingTopic[], questionCount: number, mode: IeltsSpeakingMode): QueueItem[] {
  if (mode === 'random') {
    return topics.slice(0, 8).map((t) => {
      const shuffled = [...t.questions].sort(() => Math.random() - 0.5);
      return { topicName: t.name, questionId: shuffled[0].id, questionText: shuffled[0].text };
    });
  }
  return topics.flatMap((t) => {
    const shuffled = [...t.questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, questionCount).map((q) => ({
      topicName: t.name,
      questionId: q.id,
      questionText: q.text,
    }));
  });
}

const SILENCE_THRESHOLD_MS = 2800;
const MIN_WORDS_BEFORE_SILENCE_DETECT = 3;

const IeltsSpeakingP1Session = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();
  const input = location.state as SessionInput | null;

  // ── Build question queue ──────────────────────────────────────────────────
  const queue = useRef<QueueItem[]>(
    input ? buildQueue(input.topics, input.questionCount, input.mode) : [],
  );
  const isMock = input?.isMockMode ?? false;

  // ── Stable refs to avoid stale closures ──────────────────────────────────
  const answersRef = useRef<IeltsAnswerRecord[]>([]);
  const answerStartRef = useRef<number>(0);
  const sessionStartRef = useRef<number>(Date.now());
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTranscriptRef = useRef('');

  // ── UI state ──────────────────────────────────────────────────────────────
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [silenceLeft, setSilenceLeft] = useState<number | null>(null);

  const speech = useSpeechRecognition({ continuous: true, interimResults: true });
  const voiceReader = useVoiceReader({ exerciseId: `ielts-p1-q${idx}` });

  const currentItem = queue.current[idxRef.current];

  // ── Redirect if no input or user navigated here via browser history ───────
  useEffect(() => {
    if (!input || queue.current.length === 0 || navType === 'POP') {
      navigate('/speaking/ielts-p1', { replace: true });
    }
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clearSilenceTimers = useCallback(() => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (silenceIntervalRef.current) { clearInterval(silenceIntervalRef.current); silenceIntervalRef.current = null; }
    setSilenceLeft(null);
  }, []);

  const startListening = useCallback(() => {
    speech.reset();
    currentTranscriptRef.current = '';
    answerStartRef.current = Date.now();
    speech.start();
  }, [speech]);

  // Central advance: save answer → move to next question or finish
  const advanceQuestion = useCallback(() => {
    clearSilenceTimers();
    speech.stop();
    voiceReader.stop();

    const item = queue.current[idxRef.current];
    const record: IeltsAnswerRecord = {
      questionId: item?.questionId ?? '',
      question: item?.questionText ?? '',
      topicName: item?.topicName ?? '',
      transcript: currentTranscriptRef.current.trim(),
      durationSeconds: Math.round((Date.now() - answerStartRef.current) / 1000),
    };

    answersRef.current = [...answersRef.current, record];
    const nextIdx = idxRef.current + 1;

    if (nextIdx >= queue.current.length) {
      navigate('/speaking/ielts-p1/result', {
        state: {
          answers: answersRef.current,
          mode: input?.mode,
          durationSeconds: Math.round((Date.now() - sessionStartRef.current) / 1000),
          isMock,
        },
      });
    } else {
      idxRef.current = nextIdx;
      setIdx(nextIdx);
      setPhase('reading');
    }
  }, [clearSilenceTimers, speech, voiceReader, input, isMock, navigate]);

  // Keep ref so silence timer always has latest version
  const advanceRef = useRef(advanceQuestion);
  advanceRef.current = advanceQuestion;

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) { setPhase('reading'); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // ── Read question aloud when phase transitions to 'reading' ───────────────
  useEffect(() => {
    if (phase !== 'reading' || !currentItem) return;
    clearSilenceTimers();
    const segs = makeVoiceReaderSegments([currentItem.questionText]);
    const spoke = voiceReader.speakSegments(segs, { mode: 'single' });
    if (!spoke) {
      // Voice reader disabled → skip straight to listening
      setPhase('listening');
      startListening();
    }
  }, [phase, idx]); // idx triggers re-run for each new question

  // When voice reader finishes reading → start recording
  useEffect(() => {
    if (phase !== 'reading') return;
    if (voiceReader.status === 'completed' || voiceReader.status === 'error') {
      setPhase('listening');
      startListening();
    }
  }, [voiceReader.status, phase]);

  // Track transcript into ref
  useEffect(() => {
    currentTranscriptRef.current = speech.transcript;
  }, [speech.transcript]);

  // ── Silence detection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'listening') { clearSilenceTimers(); return; }

    const wordCount = speech.transcript.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < MIN_WORDS_BEFORE_SILENCE_DETECT) { clearSilenceTimers(); return; }

    // Interim means user is still speaking — reset
    if (speech.interimTranscript) { clearSilenceTimers(); return; }

    // Start silence timer only once
    if (!silenceTimerRef.current) {
      let remaining = Math.round(SILENCE_THRESHOLD_MS / 1000);
      setSilenceLeft(remaining);
      silenceIntervalRef.current = setInterval(() => {
        remaining -= 1;
        setSilenceLeft(remaining > 0 ? remaining : null);
      }, 1000);
      silenceTimerRef.current = setTimeout(() => {
        clearSilenceTimers();
        advanceRef.current();
      }, SILENCE_THRESHOLD_MS);
    }
  }, [speech.transcript, speech.interimTranscript, phase, clearSilenceTimers]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearSilenceTimers();
    speech.stop();
    voiceReader.stop();
  }, []);

  if (!currentItem) return null;

  const progress = (idx / queue.current.length) * 100;
  const liveText = speech.transcript + (speech.interimTranscript ? ' ' + speech.interimTranscript : '');

  return (
    <div className="max-w-2xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-300">

      {/* ── Countdown overlay ─────────────────────────────────── */}
      {phase === 'countdown' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm">
          <p className="text-white/60 text-sm font-medium mb-4 uppercase tracking-widest">Get ready</p>
          <div className="text-8xl font-black text-white tabular-nums">
            {countdown === 0 ? 'Go!' : countdown}
          </div>
          <p className="text-white/40 text-xs mt-6">
            IELTS Speaking Part 1 · {queue.current.length} question{queue.current.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between mb-6">
        <button
          onClick={() => { clearSilenceTimers(); speech.stop(); voiceReader.stop(); navigate('/speaking/ielts-p1'); }}
          className="text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white"
        >
          ✕ Exit
        </button>
        <div className="flex items-center gap-2">
          {isMock && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Mock
            </span>
          )}
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Q{idx + 1} / {queue.current.length}
          </span>
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────────────── */}
      <div className="shrink-0 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Topic chip ────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 mb-4">
        <span className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
          {currentItem.topicName}
        </span>
        {phase === 'reading' && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Reading question…
          </span>
        )}
      </div>

      {/* ── Question card ─────────────────────────────────────── */}
      <div className="shrink-0 glass-card rounded-3xl p-6 sm:p-8 mb-6 shadow-sm relative">
        <p className="text-xl sm:text-2xl font-semibold leading-relaxed text-slate-800 dark:text-slate-100 pr-10">
          {currentItem.questionText}
        </p>
        <button
          onClick={() => voiceReader.speakSegments(makeVoiceReaderSegments([currentItem.questionText]), { mode: 'single' })}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-500 hover:scale-110 transition-transform"
          title="Replay question"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* ── Live transcript area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center gap-6">
        <div className="w-full min-h-[80px] px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          {phase === 'listening' ? (
            liveText ? (
              <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">{liveText}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Listening — start speaking…</p>
            )
          ) : (
            <p className="text-sm text-slate-400 italic">
              {phase === 'reading' ? 'Question is being read aloud…' : 'Preparing…'}
            </p>
          )}
        </div>

        {/* Silence countdown */}
        {silenceLeft !== null && silenceLeft > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            Auto-advancing in {silenceLeft}s — or tap Next
          </div>
        )}

        {/* Mic visual */}
        <button
          disabled={phase !== 'listening'}
          onClick={phase === 'listening' ? advanceQuestion : undefined}
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl relative',
            phase === 'listening' && speech.isListening
              ? 'bg-indigo-600 text-white scale-110 shadow-indigo-500/40'
              : phase === 'listening'
              ? 'bg-white dark:bg-slate-700 text-indigo-500 border-2 border-indigo-200 dark:border-indigo-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed',
          )}
        >
          {phase === 'listening' && speech.isListening && (
            <span className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-ping opacity-60" />
          )}
          <Mic className="w-8 h-8" />
        </button>

        <p className="text-xs text-slate-400 text-center">
          {phase === 'listening'
            ? speech.isListening
              ? 'Recording — tap to submit answer'
              : 'Starting…'
            : phase === 'reading'
            ? 'Listen to the question'
            : 'Almost ready…'}
        </p>
      </div>

      {/* ── Next / Finish button ───────────────────────────────── */}
      <div className="shrink-0 mt-6 pb-4">
        <button
          onClick={advanceQuestion}
          disabled={phase !== 'listening'}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all',
            phase === 'listening'
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed',
          )}
        >
          {idx + 1 >= queue.current.length ? 'Finish & See Results' : 'Next Question'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default IeltsSpeakingP1Session;
