import React from 'react';
import { ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { SpeakingFeedback } from '../services/ai';
import { DiffViewer } from '../components/DiffViewer';

// SVG Score Ring Component
const ScoreRing = ({ score, label, color, size = 120, strokeWidth = 10 }: { score: number, label: string, color: string, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-200 dark:stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score}</span>
      </div>
      <span className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
};

const SpeakingResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { result, recognizedText, transcript, practice } = (location.state as { result: SpeakingFeedback, recognizedText: string, transcript: string, practice: any }) || {};

  if (!result) {
    return <div className="p-8 text-center text-slate-500">No result found. Please practice first.</div>;
  }

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 pb-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Practice Results</h1>

      {/* Top Scores */}
      <div className="glass-card rounded-3xl p-8 mb-8 flex flex-wrap justify-around items-center gap-8 shadow-lg">
        <ScoreRing score={result.score} label="Overall Score" color="stroke-indigo-500" size={160} strokeWidth={12} />
        <div className="w-px h-32 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
        <ScoreRing score={result.pronunciationScore} label="Pronunciation" color="stroke-green-500" />
        <ScoreRing score={result.fluencyScore} label="Fluency" color="stroke-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Word-level comparison */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-6">Detailed Analysis</h2>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Target Speech vs What You Said</h3>
            <DiffViewer original={transcript} modified={recognizedText} />
          </div>

          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-sm font-medium"><span className="w-3 h-3 rounded-full bg-green-500"></span> Added/Extra</div>
             <div className="flex items-center gap-2 text-sm font-medium"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Mispronounced/Replaced</div>
             <div className="flex items-center gap-2 text-sm font-medium"><span className="w-3 h-3 rounded-full bg-red-500"></span> Skipped/Deleted</div>
          </div>
        </div>

        {/* Fluency Metrics & Feedback */}
        <div className="glass-card rounded-3xl p-8 flex flex-col gap-6">
          <h2 className="text-xl font-bold">Feedback</h2>
          
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 font-medium">Vocabulary</span>
            <span className="font-bold text-lg text-indigo-600">{result.vocabularyScore}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 font-medium">Grammar</span>
            <span className="font-bold text-lg">{result.grammarScore}</span>
          </div>
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl flex gap-3 items-start border border-indigo-100 dark:border-indigo-800">
            <AlertTriangle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-900 dark:text-indigo-200">{result.feedback}</p>
          </div>

          <div className="mt-auto bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
             <h3 className="text-sm font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-2">How to Improve</h3>
             <ul className="text-sm text-orange-900 dark:text-orange-200 space-y-1.5 list-disc list-inside">
               {result.improvementTips && result.improvementTips.length > 0 ? (
                 result.improvementTips.map((tip, i) => <li key={i} className="leading-snug">{tip}</li>)
               ) : (
                 <li>Practice reading aloud slowly to improve pronunciation.</li>
               )}
             </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <button 
          onClick={() => navigate('/speaking/record')}
          className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md hover:shadow-lg transition-all"
        >
          <RotateCcw className="w-5 h-5" /> Practice Again
        </button>
        <button 
          onClick={() => navigate('/speaking')}
          className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-105 transition-all"
        >
          Next Lesson <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SpeakingResult;
