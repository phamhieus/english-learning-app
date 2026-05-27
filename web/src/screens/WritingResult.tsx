import React from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Copy, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { WritingFeedback } from '../services/ai';
import { DiffViewer } from '../components/DiffViewer';
import type { Practice } from '../services/storage';

const WritingResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { result, originalText } = (location.state as { result: WritingFeedback, originalText: string, practice: Practice }) || {};

  if (!result) {
    return <div className="p-8 text-center text-slate-500">No result found. Please submit a practice first.</div>;
  }

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 pb-10">
      <h1 className="text-3xl font-bold mb-8">AI Feedback</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="col-span-2 md:col-span-1 glass-card rounded-2xl p-6 flex flex-col items-center justify-center border-t-4 border-indigo-500 shadow-md">
          <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{result.bandScore}</span>
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-2">Band Score</span>
        </div>
        
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-bold uppercase mb-1">Task Achievement</span>
          <span className="text-2xl font-bold">{result.subScores?.taskAchievement || '-'}</span>
        </div>
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-bold uppercase mb-1">Coherence</span>
          <span className="text-2xl font-bold text-orange-500">{result.subScores?.coherence || '-'}</span>
        </div>
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-bold uppercase mb-1">Lexical Resource</span>
          <span className="text-2xl font-bold text-green-500">{result.subScores?.lexicalResource || '-'}</span>
        </div>
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-bold uppercase mb-1">Grammar</span>
          <span className="text-2xl font-bold">{result.subScores?.grammar || '-'}</span>
        </div>
      </div>

      {/* Overall Feedback & Improvement Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
          <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Overall Feedback
          </h3>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
            {result.overallFeedback || "Great effort! Review the specific corrections below to see how to improve."}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
          <h3 className="text-sm font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> How to Improve
          </h3>
          <ul className="text-slate-700 dark:text-slate-300 text-sm space-y-1.5 list-disc list-inside">
            {result.improvementTips && result.improvementTips.length > 0 ? (
              result.improvementTips.map((tip, i) => <li key={i} className="leading-snug">{tip}</li>)
            ) : (
              <li>Keep practicing to expand your vocabulary and refine grammar.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Original Text with Highlights */}
        <div className="glass-card rounded-3xl p-8 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              Your Writing <span className="bg-slate-100 dark:bg-slate-800 text-xs px-2 py-1 rounded">{originalText?.trim().split(/\s+/).length || 0} words</span>
            </h2>
            <div className="flex gap-3">
               <div className="flex items-center gap-1.5 text-xs font-medium"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Added</div>
               <div className="flex items-center gap-1.5 text-xs font-medium"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Replaced</div>
               <div className="flex items-center gap-1.5 text-xs font-medium"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Deleted</div>
            </div>
          </div>
          
          <div className="text-lg leading-loose font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            <DiffViewer original={originalText} modified={result.improvedText} />
          </div>

          <div className="mt-auto pt-6 border-t border-[var(--border)]">
             <h3 className="font-bold text-sm mb-3">Detected Issues:</h3>
             <ul className="space-y-2">
               {result.corrections && result.corrections.length > 0 ? result.corrections.map((c, i) => (
                 <li key={i} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                   <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> 
                   <div>
                     <span className="line-through opacity-75 mr-2">{c.original}</span>
                     <span className="font-bold text-green-600 dark:text-green-400">{c.replacement}</span>
                     <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-xs">{c.explanation}</p>
                   </div>
                 </li>
               )) : (
                 <li className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Great job! No major issues detected.
                 </li>
               )}
             </ul>
          </div>
        </div>

        {/* Improved Version */}
        <div className="glass-card rounded-3xl p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900/80 border-2 border-green-100 dark:border-green-900/30 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-3xl"></div>
          
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h2 className="text-xl font-bold flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5" /> Improved Version
            </h2>
            <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-lg leading-loose font-medium text-slate-800 dark:text-slate-200 relative z-10 whitespace-pre-wrap">
            {result.improvedText}
          </div>

          <div className="mt-auto pt-6 border-t border-[var(--border)] relative z-10">
             <p className="text-sm text-slate-600 dark:text-slate-400">
               <strong>Why is this better?</strong> It uses a more professional tone, improves vocabulary, and clearly addresses the prompt.
             </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button 
          onClick={() => navigate('/writing/editor')}
          className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md hover:shadow-lg transition-all"
        >
          <RefreshCw className="w-5 h-5" /> Revise Again
        </button>
        <button 
          onClick={() => navigate('/writing')}
          className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl hover:scale-105 transition-all"
        >
          Next Lesson <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};

export default WritingResult;
