import React from "react";

interface ScoreRingProps {
  score: number;
  label: string;
  colorClass: string; // Tailwind stroke color e.g., 'stroke-indigo-600'
  size?: number;
  strokeWidth?: number;
}

export const ScoreRing = ({
  score,
  label,
  colorClass,
  size = 100,
  strokeWidth = 8,
}: ScoreRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center p-2">
      <svg width={size} height={size} className="-rotate-90 transform">
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
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">
          {score}
        </span>
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
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row items-center gap-8 w-full">
      {/* Overall Score Dial */}
      <div className="flex justify-center shrink-0 w-full lg:w-auto border-b lg:border-b-0 lg:border-r border-slate-50 dark:border-slate-800/60 pb-6 lg:pb-0 lg:pr-8">
        <ScoreRing
          score={overallScore}
          label="Overall Score"
          colorClass="stroke-indigo-600 dark:stroke-indigo-500"
          size={150}
          strokeWidth={12}
        />
      </div>

      {/* Dimensions Grid */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-4 w-full">
        <div className="flex justify-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
          <ScoreRing
            score={pronunciationScore}
            label="Pronunciation"
            colorClass="stroke-emerald-500 dark:stroke-emerald-400"
            size={84}
            strokeWidth={6}
          />
        </div>
        <div className="flex justify-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
          <ScoreRing
            score={fluencyScore}
            label="Fluency"
            colorClass="stroke-orange-500 dark:stroke-orange-400"
            size={84}
            strokeWidth={6}
          />
        </div>
        <div className="flex justify-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
          <ScoreRing
            score={rhythmScore}
            label="Rhythm"
            colorClass="stroke-fuchsia-500 dark:stroke-fuchsia-400"
            size={84}
            strokeWidth={6}
          />
        </div>
        <div className="flex justify-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
          <ScoreRing
            score={intonationScore}
            label="Intonation"
            colorClass="stroke-teal-500 dark:stroke-teal-400"
            size={84}
            strokeWidth={6}
          />
        </div>
        <div className="flex justify-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-900/50 col-span-2 sm:col-span-1">
          <ScoreRing
            score={stressScore}
            label="Stress"
            colorClass="stroke-indigo-500 dark:stroke-indigo-400"
            size={84}
            strokeWidth={6}
          />
        </div>
      </div>
    </div>
  );
}
export default SpeakingScoreCards;
