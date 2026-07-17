import { useEffect, useMemo, useState } from 'react';
import { Check, Image, ArrowLeft, Timer, RotateCcw, PenLine } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../components/classNames';
import { OptimizedImage } from '../components/OptimizedImage';
import { thumbnailUrl } from '../components/imageUrl';
import { useSettings } from '../components/useSettings';
import { evaluateSentenceWriting } from '../services/ai';
import { addHistory } from '../services/storage';
import { runComboStepInBackground } from '../features/combo-practice/services/comboSession';
import { useToast } from '../components/useToast';
import type { SentenceWritingPractice as Practice } from '../features/picture-sentence/types/picture-sentence.types';

// Official TOEIC Writing Part 1 is 8 minutes for all 5 questions (~96s each).
const PER_QUESTION_SECONDS = 96;

const SentenceWritingPractice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const { error: showError, success: showSuccess } = useToast();
  const practice = (location.state?.practice || {
    id: 0,
    title: 'A scene from daily life',
    imageUrl: '',
    level: 'Medium',
    category: 'Daily Life',
    words: ['picture', 'show'],
    duration: '~1.5 min',
  }) as Practice;

  const [sentence, setSentence] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(PER_QUESTION_SECONDS);

  const wordCount = useMemo(
    () => sentence.trim().split(/\s+/).filter(Boolean).length,
    [sentence],
  );

  // Soft countdown — never force-submits (writing needs care), just signals time.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const handleEvaluate = async () => {
    if (!sentence.trim()) return;
    const runEvaluation = async () => {
      const result = await evaluateSentenceWriting(settings, practice.title, practice.words, sentence, practice.imageUrl);
      addHistory({
        title: practice.title,
        type: 'Write a Sentence',
        score: result.score,
        focus: 'Write a Sentence',
      });
      return result;
    };
    // Combo mode: move straight to the next part; the AI scores this one in
    // the background and the combined result page fills in when it resolves.
    const comboNext = runComboStepInBackground({
      resultRoute: '/writing/sentence/result',
      title: practice.title,
      evaluate: async () => {
        const result = await runEvaluation();
        return { score: result.score ?? null, resultState: { result, sentence, practice } };
      },
    });
    if (comboNext) {
      navigate(comboNext.route, { state: comboNext.state });
      return;
    }
    setIsEvaluating(true);
    try {
      const result = await runEvaluation();
      showSuccess('Evaluation completed!');
      navigate('/writing/sentence/result', { state: { result, sentence, practice } });
    } catch (e) {
      console.error(e);
      showError('Failed to evaluate your sentence.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setSentence('');
    setSecondsLeft(PER_QUESTION_SECONDS);
  };

  return (
    <div className="max-w-4xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2 items-center">
          <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-sm font-semibold">
            Write a Sentence
          </span>
          <span className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold tabular-nums',
            secondsLeft <= 0
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : secondsLeft <= 15
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          )}>
            <Timer className="w-4 h-4" />
            {secondsLeft <= 0 ? "Time's up" : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`}
          </span>
          <span
            className={cn(
              'px-3 py-1 rounded-full text-sm font-semibold',
              practice.level === 'Easy'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : practice.level === 'Medium'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}
          >
            {practice.level}
          </span>
        </div>
      </div>

      {/* Picture */}
      <div className="mb-5 shrink-0">
        <div className="relative rounded-3xl overflow-hidden shadow-lg bg-slate-100 dark:bg-slate-800">
          {practice.imageUrl ? (
            <OptimizedImage
              src={practice.imageUrl}
              thumbnailSrc={thumbnailUrl(practice.imageUrl)}
              alt={practice.title}
              width={800}
              height={500}
              priority
              className="w-full max-h-[22rem]"
            />
          ) : (
            <div className="w-full aspect-video max-h-[22rem] flex flex-col items-center justify-center gap-3">
              <Image className="w-16 h-16 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-400 text-sm">Image not available</p>
            </div>
          )}
        </div>
      </div>

      {/* Required words */}
      <div className="mb-5 shrink-0 flex flex-col items-center gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Write one sentence about the picture using both words:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {practice.words.map((word) => (
            <span
              key={word}
              className="px-4 py-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-300 text-base font-bold"
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Answer box */}
      <div className="flex-1 flex flex-col gap-2 mb-4">
        <textarea
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder="Type your sentence here…"
          rows={3}
          autoFocus
          className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4 text-lg leading-relaxed text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500/60"
        />
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <PenLine className="w-3.5 h-3.5" /> Aim for one complete sentence
          </span>
          <span className="tabular-nums">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 flex items-center justify-center gap-4 pb-6">
        <button
          onClick={handleReset}
          disabled={isEvaluating}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
        <button
          onClick={handleEvaluate}
          disabled={!sentence.trim() || isEvaluating}
          className={cn(
            'flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all',
            sentence.trim() && !isEvaluating
              ? 'bg-orange-500 hover:bg-orange-600 hover:scale-105 shadow-orange-500/30'
              : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
          )}
        >
          {isEvaluating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Evaluating…
            </>
          ) : (
            <>
              <Check className="w-5 h-5" /> Submit for scoring
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SentenceWritingPractice;
