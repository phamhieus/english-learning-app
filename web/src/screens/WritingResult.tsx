import React from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Copy, ArrowRight, BookOpen, Info } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { WritingFeedback } from '../services/ai';
import { CorrectionHighlighter } from '../features/writing/CorrectionHighlighter';
import type { Practice } from '../services/storage';
import { useSettings } from '../components/useSettings';
import { cn } from '../components/classNames';
import ChartPrompt, { detectChartType, TREND_VOCAB, CHART_TYPE_LABELS } from '../features/writing/IELTSChart';

// Small exam badge — mirrors the one used in WritingList, kept local to this screen.
const ExamPill = ({ exam }: { exam: 'TOEIC' | 'IELTS' }) => (
  <span className={cn(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
    exam === 'TOEIC' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
  )}>
    {exam}
  </span>
);

// IELTS official band descriptors — shown as an examiner note under the feedback.
const ieltsDescriptor = (band: number): string => {
  if (band >= 8) return 'Very good user — fully operational command with only occasional unsystematic inaccuracies.';
  if (band >= 7) return 'Good user — handles complex language well, with occasional inaccuracies.';
  if (band >= 6) return 'Competent user — generally effective command despite some inaccuracies.';
  if (band >= 5) return 'Modest user — partial command, coping with overall meaning in most situations.';
  return 'Limited user — basic competence is limited to familiar situations.';
};

const WritingResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const { result, originalText, exam, practice, taskKey = '' } = (location.state as { result: WritingFeedback, originalText: string, practice: Practice, exam?: 'TOEIC' | 'IELTS', taskKey?: string }) || {};
  const activeExam = exam || settings.primaryExam;
  const isChartTask = taskKey === 't1a';
  const scaleLabel = activeExam === 'TOEIC' ? 'TOEIC Score' : 'Band Score';

  const criteriaLabels = activeExam === 'TOEIC'
    ? {
        taskAchievement: 'Task Completion',
        coherence: 'Organization',
        lexicalResource: 'Vocabulary',
        grammar: 'Grammar',
      }
    : taskKey === 't2'
    ? {
        taskAchievement: 'Task Response',
        coherence: 'Coherence & Cohesion',
        lexicalResource: 'Lexical Resource',
        grammar: 'Grammatical Range',
      }
    : taskKey === 't1g'
    ? {
        taskAchievement: 'Task Achievement (Register + Bullets)',
        coherence: 'Coherence & Cohesion',
        lexicalResource: 'Lexical Resource',
        grammar: 'Grammatical Range',
      }
    : {
        taskAchievement: 'Task Achievement',
        coherence: 'Coherence & Cohesion',
        lexicalResource: 'Lexical Resource',
        grammar: 'Grammatical Range',
      };

  if (!result) {
    return <div className="p-8 text-center text-slate-500">No result found. Please submit a practice first.</div>;
  }

  // Header subtitle + dynamic copy that adapts to the exam/task.
  const taskLabel = activeExam === 'TOEIC'
    ? 'Writing'
    : taskKey === 't2'
    ? 'Task 2 · Essay'
    : taskKey === 't1g'
    ? 'Task 1 · General'
    : 'Task 1 · Academic';

  const bandNum = parseFloat(result.bandScore);
  const isIelts = activeExam === 'IELTS' && !Number.isNaN(bandNum);
  const targetBand = isIelts ? Math.min(9, Math.floor(bandNum) + 1) : null;
  const pushHeading = targetBand !== null ? `Push to Band ${targetBand}` : 'How to Improve';
  const modelTitle = targetBand !== null ? `Band ${targetBand} Model Answer` : 'Model Answer';
  const descriptor = isIelts ? ieltsDescriptor(bandNum) : null;

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 pb-10">
      <div className="flex items-center gap-2 mb-2">
        <ExamPill exam={activeExam} />
        <span className="text-sm font-semibold text-slate-500">Writing · {taskLabel}</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">AI Examiner Feedback</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="col-span-2 md:col-span-1 glass-card rounded-2xl p-6 flex flex-col items-center justify-center border-t-4 border-indigo-500 shadow-md">
          <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{result.bandScore}</span>
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-2">{scaleLabel}</span>
        </div>
        
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-bold uppercase mb-1">{criteriaLabels.taskAchievement}</span>
          <span className="text-2xl font-bold">{result.subScores?.taskAchievement || '-'}</span>
        </div>
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-bold uppercase mb-1">{criteriaLabels.coherence}</span>
          <span className="text-2xl font-bold text-orange-500">{result.subScores?.coherence || '-'}</span>
        </div>
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-bold uppercase mb-1">{criteriaLabels.lexicalResource}</span>
          <span className="text-2xl font-bold text-green-500">{result.subScores?.lexicalResource || '-'}</span>
        </div>
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-bold uppercase mb-1">{criteriaLabels.grammar}</span>
          <span className="text-2xl font-bold">{result.subScores?.grammar || '-'}</span>
        </div>
      </div>

      {/* Overall Feedback & Improvement Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-2xl p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
          <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Examiner Feedback
          </h3>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm mb-3">
            {result.overallFeedback || "Great effort! Review the specific corrections below to see how to improve."}
          </p>
          {descriptor && (
            <div className="flex items-start gap-2 text-xs text-indigo-900 dark:text-indigo-200 bg-white/60 dark:bg-white/5 rounded-lg p-2.5 border border-indigo-100 dark:border-indigo-900/30">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {descriptor}
            </div>
          )}
        </div>
        <div className="glass-card rounded-2xl p-6 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
          <h3 className="text-sm font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {pushHeading}
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

      {/* Learning Mode — chart + vocabulary (only for IELTS chart tasks) */}
      {isChartTask && practice?.title && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            Chart Review
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold uppercase tracking-wide ml-1">Learning Mode</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Chart with highlights — takes 3/5 on desktop */}
            <div className="lg:col-span-3">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
                {CHART_TYPE_LABELS[detectChartType(practice.title)]} — key features highlighted
              </p>
              <ChartPrompt title={practice.title} learning />
            </div>
            {/* Vocabulary guide — takes 2/5 on desktop */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-amber-100 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-900/10">
              <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Trend Vocabulary
              </h3>
              <ul className="space-y-2.5">
                {TREND_VOCAB.map(({ phrase, use }) => (
                  <li key={phrase} className="flex items-start gap-3 text-sm">
                    <code className="shrink-0 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs leading-5 mt-0.5">
                      {phrase}
                    </code>
                    <span className="text-slate-500 dark:text-slate-400 text-xs leading-5 mt-0.5">{use}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500 italic">
                Use these phrases in your overview and body paragraphs to describe trends accurately.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Original Text with Highlights */}
        <div className="glass-card rounded-3xl p-5 sm:p-8 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              Your Writing <span className="bg-slate-100 dark:bg-slate-800 text-xs px-2 py-1 rounded">{originalText?.trim().split(/\s+/).length || 0} words</span>
            </h2>
            <div className="flex gap-3">
               <div className="flex items-center gap-1.5 text-xs font-medium"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Stronger</div>
               <div className="flex items-center gap-1.5 text-xs font-medium"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Upgrade</div>
               <div className="flex items-center gap-1.5 text-xs font-medium"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Cut</div>
            </div>
          </div>
          
          <div className="text-base sm:text-lg leading-loose font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            <CorrectionHighlighter text={originalText} corrections={result.corrections} />
          </div>

          <div className="mt-auto pt-6 border-t border-[var(--border)]">
             <h3 className="font-bold text-sm mb-3">Suggested edits:</h3>
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
        <div className="glass-card rounded-3xl p-5 sm:p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900/80 border-2 border-green-100 dark:border-green-900/30 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-3xl"></div>
          
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h2 className="text-xl font-bold flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5" /> {modelTitle}
            </h2>
            <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-base sm:text-lg leading-loose font-medium text-slate-800 dark:text-slate-200 relative z-10 whitespace-pre-wrap">
            {result.improvedText}
          </div>

          <div className="mt-auto pt-6 border-t border-[var(--border)] relative z-10">
             <p className="text-sm text-slate-600 dark:text-slate-400">
               <strong>Why is this better?</strong> It uses a more professional tone, improves vocabulary, and clearly addresses the prompt.
             </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
        <button
          onClick={() => navigate('/writing/editor', {
            state: { practice, taskKey, taskLabel, exam: activeExam },
          })}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md hover:shadow-lg transition-all"
        >
          <RefreshCw className="w-5 h-5" /> Revise Again
        </button>
        <button
          onClick={() => navigate('/writing')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl hover:scale-105 transition-all"
        >
          Next Task <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};

export default WritingResult;
