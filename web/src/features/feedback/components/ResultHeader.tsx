import { ArrowLeft, RotateCcw, ArrowRight, Clock } from 'lucide-react';
import { cn } from '../../../components/classNames';
import type { FeedbackModule, FeedbackModuleConfig } from '../types/feedback.types';

interface ResultHeaderProps {
  config: FeedbackModuleConfig;
  scoreLabel: string;
  overallScore?: number;
  createdAt: string;
  onRetry: () => void;
  onNext: () => void;
  onBack: () => void;
}

const scoreBg = (module: FeedbackModule, score?: number): string => {
  if (module === 'shadowing') {
    if ((score ?? 0) >= 85) return 'from-emerald-500 to-teal-500';
    if ((score ?? 0) >= 70) return 'from-indigo-500 to-violet-500';
    return 'from-orange-500 to-amber-500';
  }
  // Band score (0-9): 7+ green, 5.5-6.5 indigo, <5.5 orange
  const band = score ?? 0;
  if (band >= 7) return 'from-emerald-500 to-teal-500';
  if (band >= 5.5) return 'from-indigo-500 to-violet-500';
  return 'from-orange-500 to-amber-500';
};

export function ResultHeader({
  config,
  scoreLabel,
  overallScore,
  createdAt,
  onRetry,
  onNext,
  onBack,
}: ResultHeaderProps) {
  const dateStr = new Date(createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white shadow-2xl">
      {/* Decorative circles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-8">
        {/* Top row: back + module label */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-white/50 bg-white/10 px-3 py-1 rounded-full">
            {config.label}
          </span>
        </div>

        {/* Score */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
          <div className={cn(
            'flex-shrink-0 w-24 h-24 rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center shadow-lg',
            scoreBg(config.module, overallScore)
          )}>
            <span className="text-2xl font-black leading-none">
              {config.scoreUnit === 'band' ? (overallScore ?? '–') :
               config.scoreUnit === 'percent' ? `${overallScore ?? 0}%` :
               overallScore ?? '–'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 mt-0.5">
              {config.scoreUnit === 'band' ? 'Band' :
               config.scoreUnit === 'percent' ? 'match' : 'score'}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">{scoreLabel}</h1>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <Clock className="w-3.5 h-3.5" />
              {dateStr}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-white/90 text-sm font-semibold transition-colors"
          >
            Next Practice <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
