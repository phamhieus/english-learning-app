import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, MessageSquareText, RefreshCw, Volume2 } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { useSpeechRecognition } from '../../../services/useSpeechRecognition';
import { useVoiceReader } from '../../voice-reader/useVoiceReader';
import { makeVoiceReaderSegments } from '../../voice-reader/voiceReaderText';
import { PART3_DISCUSSION_SETS, getLinkedPart3Set } from '../data/part3DiscussionSets';
import type { IeltsP3AnswerInput } from '../types/ielts-speaking.types';

const QUESTION_COUNT = 5;
const PART3_THEMES = Array.from(new Set(PART3_DISCUSSION_SETS.map((set) => set.theme)));

const IeltsSpeakingP3Session = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionState = location.state as { cueCardId?: string; discussionSetId?: string } | null;
  const hasSelectedSet = Boolean(sessionState?.cueCardId || sessionState?.discussionSetId);
  const discussionSet = useMemo(() => {
    if (sessionState?.discussionSetId) {
      return PART3_DISCUSSION_SETS.find((set) => set.id === sessionState.discussionSetId) ?? getLinkedPart3Set(sessionState?.cueCardId);
    }
    return getLinkedPart3Set(sessionState?.cueCardId);
  }, [sessionState?.cueCardId, sessionState?.discussionSetId]);
  const questions = useMemo(() => discussionSet.questions.slice(0, QUESTION_COUNT), [discussionSet]);
  const speech = useSpeechRecognition({ continuous: true, interimResults: true });
  const reader = useVoiceReader({ exerciseId: `ielts-p3-${discussionSet.id}` });
  const sessionStartRef = useRef(Date.now());
  const answerStartRef = useRef(Date.now());
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<IeltsP3AnswerInput[]>([]);
  const [isReading, setIsReading] = useState(true);

  const current = questions[idx];
  const liveText = speech.transcript + (speech.interimTranscript ? ` ${speech.interimTranscript}` : '');

  useEffect(() => {
    if (!hasSelectedSet) return;
    if (!current) return;
    speech.reset();
    setIsReading(true);
    const spoke = reader.speakSegments(makeVoiceReaderSegments([current.text]), { mode: 'single' });
    if (!spoke) {
      setIsReading(false);
      answerStartRef.current = Date.now();
      speech.start();
    }
  }, [hasSelectedSet, idx]);

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
          <button onClick={() => navigate('/speaking')} className="text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white">
            Back
          </button>
          <button
            onClick={() => {
              const random = PART3_DISCUSSION_SETS[Math.floor(Math.random() * PART3_DISCUSSION_SETS.length)];
              navigate('/speaking/ielts/part-3', { state: { discussionSetId: random.id } });
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
            const sets = PART3_DISCUSSION_SETS.filter((set) => set.theme === theme);
            return (
              <section key={theme}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{theme}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sets.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => navigate('/speaking/ielts/part-3', { state: { discussionSetId: set.id } })}
                      className="text-left glass-card rounded-2xl p-4 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/60 hover:-translate-y-1 transition-all"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">{set.theme}</p>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{set.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {set.questions.length} discussion questions
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

  return (
    <div className="max-w-3xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-3 mb-5">
        <button onClick={() => navigate('/speaking/ielts')} className="text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white">
          Exit
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">IELTS Speaking Part 3 - Discussion</span>
      </div>

      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>

      <div className="glass-card rounded-2xl p-5 border border-transparent mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {discussionSet.theme} - question {idx + 1} of {questions.length}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight text-slate-900 dark:text-white">{current.text}</h1>
          </div>
          <button
            onClick={() => reader.speakSegments(makeVoiceReaderSegments([current.text]), { mode: 'single' })}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-500 hover:scale-105 transition-transform"
            aria-label="Replay question"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Answer framework</p>
          <ul className="space-y-1.5">
            {current.answerFramework?.map((item) => (
              <li key={item} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2">
                <span className="text-indigo-500">•</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Vocabulary hints</p>
          <div className="flex flex-wrap gap-2">
            {current.vocabularyHints?.map((hint) => (
              <span key={hint} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300">
                {hint}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 mb-5 min-h-52">
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
          'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-colors',
          isReading ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white',
        )}
      >
        {idx + 1 >= questions.length ? 'Finish Part 3' : 'Next Question'}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default IeltsSpeakingP3Session;
