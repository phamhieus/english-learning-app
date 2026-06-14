import { useLocation, useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  ArrowRight,
  Sparkles,
  Target,
  BookOpen,
  CheckCircle,
  XCircle,
  Wand2,
} from 'lucide-react';
import { cn } from '../components/classNames';
import type { SentenceWritingFeedback } from '../services/ai';
import type { SentenceWritingPractice } from '../features/picture-sentence/types/picture-sentence.types';

const ScoreRing = ({
  score,
  label,
  size = 80,
  strokeWidth = 6,
}: {
  score: number;
  label: string;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-200 dark:stroke-slate-700"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={cn('transition-all duration-1000 ease-out', color.replace('text-', 'stroke-'))}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
          {score}
        </span>
      </div>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
};

const WordCheck = ({ word, used }: { word: string; used: boolean }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border',
      used
        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
        : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300'
    )}
  >
    {used ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
    {word}
  </span>
);

const SentenceWritingResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, sentence, practice } = (location.state || {}) as {
    result?: SentenceWritingFeedback;
    sentence?: string;
    practice?: SentenceWritingPractice;
  };

  if (!result) {
    return (
      <div className="p-8 text-center text-slate-500">
        No result found. Please try again.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-400">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">
          Write a Sentence Result
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          TOEIC Writing Q1–5 scoring of your sentence
        </p>
      </div>

      {/* Overall Score + Sub-scores */}
      <div className="glass-card rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Big score */}
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={result.score} label="Overall" size={120} strokeWidth={8} />
            <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-bold">
              TOEIC {result.toeicScore}/3
            </span>
          </div>

          {/* Sub scores */}
          <div className="flex-1 grid grid-cols-2 gap-6 justify-items-center">
            <ScoreRing score={result.grammarScore} label="Grammar" />
            <ScoreRing score={result.relevanceScore} label="Relevance" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Picture + sentences */}
        <div className="lg:col-span-2 space-y-6">
          {/* Picture reference + required words */}
          {practice?.imageUrl && (
            <div className="rounded-2xl overflow-hidden shadow-md bg-slate-100 dark:bg-slate-800">
              <img
                src={practice.imageUrl}
                alt={practice.title}
                className="w-full aspect-video max-h-72 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Word usage */}
          {practice?.words && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Required Words</h3>
              <div className="flex flex-wrap gap-3">
                <WordCheck word={practice.words[0]} used={result.usedWord1} />
                <WordCheck word={practice.words[1]} used={result.usedWord2} />
              </div>
            </div>
          )}

          {/* Your sentence */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Your Sentence
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
              "{sentence || 'No answer'}"
            </p>
          </div>

          {/* Corrected sentence */}
          {result.correctedSentence && result.correctedSentence.trim() && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-amber-500" />
                Corrected Version
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {result.correctedSentence}
              </p>
            </div>
          )}

          {/* Sample sentence */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Model Answer (Score 3/3)
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {result.sampleSentence}
            </p>
          </div>
        </div>

        {/* Right: Feedback + Tips */}
        <div className="lg:col-span-1 space-y-6">
          {/* AI Feedback */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              AI Examiner Feedback
            </h3>
            <div className="p-4 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/20 rounded-2xl text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
              {result.feedback}
            </div>

            {result.improvementTips.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                  Improvement Tips
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                  {result.improvementTips.map((tip, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Quick tips card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              TOEIC Tips
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">1.</span>
                Use BOTH given words — you may change their form.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">2.</span>
                Write exactly ONE complete sentence.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">3.</span>
                Make sure it clearly describes the picture.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">4.</span>
                Check grammar: tense, articles, and prepositions.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 shrink-0">
        <button
          onClick={() => navigate('/writing/sentence/practice', { state: { practice } })}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 hover:shadow transition-all"
        >
          <RotateCcw className="w-5 h-5" /> Try Again
        </button>
        <button
          onClick={() => navigate('/writing/sentence')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold bg-orange-500 text-white shadow-lg shadow-orange-600/30 hover:bg-orange-600 hover:scale-105 active:scale-98 transition-all"
        >
          Next Picture <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SentenceWritingResult;
