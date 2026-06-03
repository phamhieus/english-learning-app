import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, MessageSquareText, Mic, Radio, RefreshCw, Volume2 } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { useTheme } from '../../../components/useTheme';
import { useSpeechRecognition } from '../../../services/useSpeechRecognition';
import { useVoiceReader } from '../../voice-reader/useVoiceReader';
import { makeVoiceReaderSegments } from '../../voice-reader/voiceReaderText';
import { PART3_DISCUSSION_SETS, generatePart3DiscussionSet, getLinkedPart3Set, getPart3ThemeGroup } from '../data/part3DiscussionSets';
import type { IeltsP3AnswerInput } from '../types/ielts-speaking.types';

const QUESTION_COUNT = 5;
const PART3_THEMES = Array.from(new Set(PART3_DISCUSSION_SETS.map((set) => getPart3ThemeGroup(set.theme))));

function createSessionKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const IeltsSpeakingP3Session = () => {
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionState = location.state as { cueCardId?: string; discussionSetId?: string; sessionKey?: string } | null;
  const fallbackSessionKeyRef = useRef(createSessionKey());
  const sessionKey = sessionState?.sessionKey ?? fallbackSessionKeyRef.current;
  const hasSelectedSet = Boolean(sessionState?.cueCardId || sessionState?.discussionSetId);
  const discussionSet = useMemo(() => {
    const baseSet = (() => {
      if (sessionState?.discussionSetId) {
        return PART3_DISCUSSION_SETS.find((set) => set.id === sessionState.discussionSetId) ?? getLinkedPart3Set(sessionState?.cueCardId);
      }
      return getLinkedPart3Set(sessionState?.cueCardId);
    })();
    return generatePart3DiscussionSet(baseSet, sessionKey, QUESTION_COUNT);
  }, [sessionState?.cueCardId, sessionState?.discussionSetId, sessionKey]);
  const questions = useMemo(() => discussionSet.questions.slice(0, QUESTION_COUNT), [discussionSet]);
  const speech = useSpeechRecognition({ continuous: true, interimResults: true });
  const reader = useVoiceReader({ exerciseId: `ielts-p3-${discussionSet.id}` });
  const sessionStartRef = useRef(Date.now());
  const answerStartRef = useRef(Date.now());
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<IeltsP3AnswerInput[]>([]);
  const [isReading, setIsReading] = useState(true);
  const [activeDiscussionSetId, setActiveDiscussionSetId] = useState(discussionSet.id);

  const current = questions[idx];
  const liveText = speech.transcript + (speech.interimTranscript ? ` ${speech.interimTranscript}` : '');

  useEffect(() => {
    if (!hasSelectedSet) return;
    speech.stop();
    reader.stop();
    speech.reset();
    setIdx(0);
    setAnswers([]);
    setIsReading(true);
    setActiveDiscussionSetId(discussionSet.id);
    sessionStartRef.current = Date.now();
    answerStartRef.current = Date.now();
  }, [hasSelectedSet, discussionSet.id]);

  useEffect(() => {
    if (!hasSelectedSet) return;
    if (activeDiscussionSetId !== discussionSet.id) return;
    if (!current) return;
    speech.reset();
    setIsReading(true);
    const spoke = reader.speakSegments(makeVoiceReaderSegments([current.text]), { mode: 'single' });
    if (!spoke) {
      setIsReading(false);
      answerStartRef.current = Date.now();
      speech.start();
    }
  }, [hasSelectedSet, activeDiscussionSetId, discussionSet.id, idx]);

  useEffect(() => {
    if (!hasSelectedSet) return;
    if (!isReading) return;
    if (reader.status === 'completed' || reader.status === 'error') {
      setIsReading(false);
      answerStartRef.current = Date.now();
      speech.start();
    }
  }, [hasSelectedSet, reader.status, isReading]);

  useEffect(() => () => {
    speech.stop();
    reader.stop();
  }, []);

  const finishAnswer = () => {
    if (!current) return;
    speech.stop();
    const nextAnswers = [
      ...answers,
      {
        questionId: current.id,
        question: current.text,
        transcript: liveText.trim(),
        durationSeconds: Math.max(1, Math.round((Date.now() - answerStartRef.current) / 1000)),
      },
    ];
    setAnswers(nextAnswers);

    if (idx + 1 >= questions.length) {
      navigate('/speaking/ielts/result', {
        state: {
          part: 'part_3',
          discussionSet,
          durationSeconds: Math.round((Date.now() - sessionStartRef.current) / 1000),
          answers: nextAnswers,
        },
      });
      return;
    }

    setIdx((value) => value + 1);
  };

  if (!current) return null;

  if (!hasSelectedSet) {
    return (
      <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={() => navigate('/speaking/ielts')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => {
              const random = PART3_DISCUSSION_SETS[Math.floor(Math.random() * PART3_DISCUSSION_SETS.length)];
              navigate('/speaking/ielts/part-3', { state: { discussionSetId: random.id, sessionKey: createSessionKey() } });
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
          >
            <RefreshCw className="w-4 h-4" /> Random discussion
          </button>
        </div>

        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-2">
            IELTS Speaking Part 3 - Discussion
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Choose a discussion topic</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Pick a broader theme first. You will answer a short sequence of abstract Part 3 questions.
          </p>
        </div>

        <div className="space-y-8">
          {PART3_THEMES.map((theme) => {
            const sets = PART3_DISCUSSION_SETS.filter((set) => getPart3ThemeGroup(set.theme) === theme);
            return (
              <section key={theme}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{theme}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sets.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => navigate('/speaking/ielts/part-3', { state: { discussionSetId: set.id, sessionKey: createSessionKey() } })}
                      className="text-left glass-card rounded-2xl p-4 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/60 hover:-translate-y-1 transition-all"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">{set.theme}</p>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{set.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {set.questions.length} base questions plus generated variants
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-300">
                        Start discussion <ChevronRight className="w-4 h-4" />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  const progressPercent = ((idx + (isReading ? 0 : 0.45)) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between">
        <button
          onClick={() => navigate('/speaking/ielts')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
            IELTS
          </span>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Part 3 · Discussion · Q{idx + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="shrink-0 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Theme + Focus Tags */}
      <div className="shrink-0 flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider">
          {discussionSet.theme}
        </span>
        {current.answerFramework && current.answerFramework[0] && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
            Discussion
          </span>
        )}
        {isReading && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Reading question…
          </span>
        )}
      </div>

      {/* Question Card */}
      <div className="shrink-0 glass-card rounded-3xl p-8 shadow-sm relative border border-slate-200 dark:border-slate-800">
        <p className="text-2xl font-semibold leading-relaxed text-slate-800 dark:text-slate-100 pr-10">
          {current.text}
        </p>
        <button
          onClick={() => reader.speakSegments(makeVoiceReaderSegments([current.text]), { mode: 'single' })}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-500 hover:scale-110 transition-transform"
          aria-label="Replay question"
        >
          <Volume2 className={cn("w-4 h-4", reader.status === 'playing' && "animate-pulse")} />
        </button>
      </div>

      {/* Answer Framework Hint */}
      {current.answerFramework && current.answerFramework.length > 0 && (
        <div className="shrink-0 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 p-4">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" /> Answer framework
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {current.answerFramework.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-800/40 text-sm font-medium text-indigo-900/80 dark:text-indigo-200/80">
                  {s}
                </span>
                {i < current.answerFramework!.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speaking Response Block */}
      <div className="flex-1 flex flex-col items-center gap-6 min-h-[220px]">
        {/* Live Transcript Container */}
        <div className="w-full min-h-[80px] px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 overflow-y-auto">
          {isReading ? (
            <p className="text-sm text-slate-400 italic flex items-center gap-2">
              <MessageSquareText className="w-4 h-4" /> Reading question...
            </p>
          ) : liveText ? (
            <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">{liveText}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">Recording — develop your answer, then tap Next</p>
          )}
        </div>

        {/* Floating Mic Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={finishAnswer}
            disabled={isReading}
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl relative',
              isReading
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed shadow-none'
                : speech.isListening
                ? 'bg-indigo-600 text-white scale-110 shadow-indigo-500/40'
                : 'bg-white dark:bg-slate-700 text-indigo-500 border-2 border-indigo-200 dark:border-indigo-800',
            )}
          >
            {speech.isListening && !isReading && (
              <span className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-ping opacity-60" />
            )}
            <Mic className="w-8 h-8" />
          </button>
          <p className="text-xs text-slate-400 text-center mt-2">
            {isReading
              ? 'Listen to the question'
              : speech.isListening
              ? 'Recording — tap to submit answer'
              : 'Starting…'}
          </p>
        </div>
      </div>

      {/* Next Question Control */}
      <div className="shrink-0 mt-6 pb-4">
        <button
          onClick={finishAnswer}
          disabled={isReading}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all duration-200 shadow-lg',
            isReading
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 hover:scale-[1.01]',
          )}
        >
          {idx + 1 >= questions.length ? 'Finish Part 3' : 'Next Question'}{' '}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default IeltsSpeakingP3Session;
