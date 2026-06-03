import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, MessageSquareText, Mic, Radio, RefreshCw, Volume2 } from 'lucide-react';
import { cn } from '../../../components/classNames';
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
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-8rem)] animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-3 mb-5">
        <button onClick={() => navigate('/speaking/ielts')} className="text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white">
          Exit
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">IELTS Speaking Part 3 - Discussion</span>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            Exam mode
          </span>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white p-4 sm:p-5 mb-5 shadow-xl shadow-slate-950/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300 mb-1">Live speaking test</p>
            <h1 className="text-2xl font-black">Part 3 examiner discussion</h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Theme</p>
              <p className="text-xs font-bold text-slate-100 truncate max-w-28">{discussionSet.theme}</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Question</p>
              <p className="text-xs font-bold text-slate-100">{idx + 1}/{questions.length}</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Status</p>
              <p className={cn('text-xs font-bold', isReading ? 'text-amber-300' : 'text-emerald-300')}>
                {isReading ? 'Listening' : 'Recording'}
              </p>
            </div>
          </div>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </section>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Question queue</p>
            <div className="space-y-2">
              {questions.map((question, questionIndex) => {
                const isDone = questionIndex < idx;
                const isActive = questionIndex === idx;
                return (
                  <div
                    key={question.id}
                    className={cn(
                      'flex gap-3 rounded-xl border p-3 transition-colors',
                      isActive
                        ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/30',
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className={cn('w-4 h-4 shrink-0 mt-0.5', isActive ? 'text-indigo-500' : 'text-slate-300')} />
                    )}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Q{questionIndex + 1}</p>
                      <p className={cn('text-xs leading-snug line-clamp-2', isActive ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400')}>
                        {question.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Response focus</p>
            <div className="space-y-2">
              {current.answerFramework?.map((item) => (
                <p key={item} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item}
                </p>
              ))}
            </div>
          </section>
        </aside>

        <main className="space-y-5">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">
                  Examiner question {idx + 1}
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-slate-900 dark:text-white">{current.text}</h2>
              </div>
              <button
                onClick={() => reader.speakSegments(makeVoiceReaderSegments([current.text]), { mode: 'single' })}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-500 hover:scale-105 transition-transform"
                aria-label="Replay question"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {current.vocabularyHints?.slice(0, 4).map((hint) => (
                <span key={hint} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300">
                  {hint}
                </span>
              ))}
            </div>
          </section>

          <section className="grid md:grid-cols-[220px_1fr] gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 text-white p-5 flex flex-col items-center justify-center min-h-72">
              <div className={cn('w-24 h-24 rounded-full flex items-center justify-center mb-4 border-4', isReading ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300')}>
                {isReading ? <MessageSquareText className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              </div>
              <p className="text-sm font-bold">{isReading ? 'Examiner is speaking' : 'Microphone is live'}</p>
              <p className="text-xs text-slate-400 text-center mt-1">
                {isReading ? 'Listen to the full question first.' : 'Answer naturally with reasons and examples.'}
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs text-cyan-300">
                <Radio className={cn('w-4 h-4', !isReading && 'animate-pulse')} />
                {isReading ? 'Stand by' : 'Recording answer'}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 min-h-72 flex flex-col">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Live transcript</p>
              <div className="flex-1">
                {isReading ? (
                  <p className="text-sm text-slate-400 italic flex items-center gap-2">
                    <MessageSquareText className="w-4 h-4" /> Reading question...
                  </p>
                ) : liveText ? (
                  <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">{liveText}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Recording - answer with reasons, examples, and wider discussion...</p>
                )}
              </div>
              <button
                onClick={finishAnswer}
                disabled={isReading}
                className={cn(
                  'mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-colors',
                  isReading ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white',
                )}
              >
                {idx + 1 >= questions.length ? 'Finish Part 3' : 'Next Question'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default IeltsSpeakingP3Session;
