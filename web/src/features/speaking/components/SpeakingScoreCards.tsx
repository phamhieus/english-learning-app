import React from "react";
import { cn } from "../../../components/classNames";

interface ScoreRingProps {
  score: number;
  label: string;
  colorClass: string; // Tailwind stroke color e.g., 'stroke-indigo-600'
  /** ViewBox coordinate space — drives stroke proportions, not the rendered px. */
  size?: number;
  strokeWidth?: number;
  /** Responsive rendered size, e.g. "w-16 h-16 sm:w-[84px] sm:h-[84px]".
   *  When omitted, the ring renders at a fixed `size` px (legacy callers). */
  sizeClass?: string;
  /** Tailwind classes for the centered value text. */
  valueClass?: string;
}

export const ScoreRing = ({
  score,
  label,
  colorClass,
  size = 100,
  strokeWidth = 8,
  sizeClass,
  valueClass,
}: ScoreRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className={cn("relative", sizeClass)} style={sizeClass ? undefined : { width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90 transform">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Active progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-black text-slate-800 dark:text-slate-100", valueClass ?? "text-xl md:text-2xl")}>
            {score}
          </span>
        </div>
      </div>
      <span className="mt-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
};

interface SpeakingScoreCardsProps {
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  rhythmScore: number;
  intonationScore: number;
  stressScore: number;
}

export function SpeakingScoreCards({
  overallScore,
  pronunciationScore,
  fluencyScore,
  rhythmScore,
  intonationScore,
  stressScore,
}: SpeakingScoreCardsProps) {
  const subScores = [
    { label: 'Pron', value: pronunciationScore, color: 'text-emerald-500 dark:text-emerald-400' },
    { label: 'Fluency', value: fluencyScore, color: 'text-orange-500 dark:text-orange-400' },
    { label: 'Rhythm', value: rhythmScore, color: 'text-fuchsia-500 dark:text-fuchsia-400' },
    { label: 'Inton.', value: intonationScore, color: 'text-teal-500 dark:text-teal-400' },
    { label: 'Stress', value: stressScore, color: 'text-indigo-500 dark:text-indigo-400' },
  ];

  return (
    <>
      {/* Mobile: plain number blocks in a single row (no rings) */}
      <div className="lg:hidden space-y-3">
        <div className="glass-card rounded-2xl p-4 flex items-center justify-center gap-3 border-t-4 border-indigo-500 shadow-sm">
          <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{overallScore}</span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">
            Overall<br />Score
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {subScores.map((s) => (
            <div key={s.label} className="glass-card rounded-xl flex flex-col items-center justify-center text-center py-3 px-1">
              <span className={cn('text-xl font-bold leading-none', s.color)}>{s.value}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: ring dials */}
      <div className="hidden lg:flex bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm lg:flex-row items-center gap-8 w-full">
      {/* Overall Score Dial */}
      <div className="flex justify-center shrink-0 w-full lg:w-auto border-b lg:border-b-0 lg:border-r border-slate-50 dark:border-slate-800/60 pb-5 lg:pb-0 lg:pr-8">
        <ScoreRing
          score={overallScore}
          label="Overall Score"
          colorClass="stroke-indigo-600 dark:stroke-indigo-500"
          size={150}
          strokeWidth={12}
          sizeClass="w-24 h-24 sm:w-[150px] sm:h-[150px]"
          valueClass="text-2xl sm:text-4xl"
        />
      </div>

      {/* Dimensions Grid */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 w-full">
        <div className="flex justify-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
          <ScoreRing
            score={pronunciationScore}
            label="Pronunciation"
            colorClass="stroke-emerald-500 dark:stroke-emerald-400"
            size={84}
            strokeWidth={6}
            sizeClass="w-16 h-16 sm:w-[84px] sm:h-[84px]"
            valueClass="text-base sm:text-2xl"
          />
        </div>
        <div className="flex justify-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
          <ScoreRing
            score={fluencyScore}
            label="Fluency"
            colorClass="stroke-orange-500 dark:stroke-orange-400"
            size={84}
            strokeWidth={6}
            sizeClass="w-16 h-16 sm:w-[84px] sm:h-[84px]"
            valueClass="text-base sm:text-2xl"
          />
        </div>
        <div className="flex justify-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
          <ScoreRing
            score={rhythmScore}
            label="Rhythm"
            colorClass="stroke-fuchsia-500 dark:stroke-fuchsia-400"
            size={84}
            strokeWidth={6}
            sizeClass="w-16 h-16 sm:w-[84px] sm:h-[84px]"
            valueClass="text-base sm:text-2xl"
          />
        </div>
        <div className="flex justify-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
          <ScoreRing
            score={intonationScore}
            label="Intonation"
            colorClass="stroke-teal-500 dark:stroke-teal-400"
            size={84}
            strokeWidth={6}
            sizeClass="w-16 h-16 sm:w-[84px] sm:h-[84px]"
            valueClass="text-base sm:text-2xl"
          />
        </div>
        <div className="flex justify-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-900/50 col-span-2 sm:col-span-1">
          <ScoreRing
            score={stressScore}
            label="Stress"
            colorClass="stroke-indigo-500 dark:stroke-indigo-400"
            size={84}
            strokeWidth={6}
            sizeClass="w-16 h-16 sm:w-[84px] sm:h-[84px]"
            valueClass="text-base sm:text-2xl"
          />
        </div>
      </div>
      </div>
    </>
  );
}
export default SpeakingScoreCards;
