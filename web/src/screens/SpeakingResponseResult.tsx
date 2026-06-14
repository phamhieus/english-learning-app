import { useLocation, useNavigate } from 'react-router-dom';
import { RotateCcw, ArrowRight, Sparkles, CheckCircle2, XCircle, MessageSquareQuote } from 'lucide-react';
import { cn } from '../components/classNames';
import { ScoreRing } from '../features/speaking/components/SpeakingScoreCards';
import type { SpeakingResponseFeedback, SpeakingTaskContent } from '../services/ai';

interface ResultState {
  result: SpeakingResponseFeedback;
  content: SpeakingTaskContent;
  answers: string[];
  practice: { id?: string | number; title: string; level?: string };
  taskKey: string;
  taskLabel: string;
}

const SpeakingResponseResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultState | undefined;

  if (!state?.result) {
    return <div className="p-8 text-center text-slate-500">Result not found. Please try again.</div>;
  }

  const { result, content, answers, practice, taskKey, taskLabel } = state;

  const subScores = [
    { label: 'Content', value: result.contentScore, color: 'stroke-emerald-500 dark:stroke-emerald-400' },
    { label: 'Grammar', value: result.grammarScore, color: 'stroke-orange-500 dark:stroke-orange-400' },
    { label: 'Vocabulary', value: result.vocabularyScore, color: 'stroke-fuchsia-500 dark:stroke-fuchsia-400' },
    { label: 'Fluency', value: result.fluencyScore, color: 'stroke-teal-500 dark:stroke-teal-400' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div className="text-center space-y-2">
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">TOEIC Speaking</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{taskLabel} — Results</h1>
        <p className="text-sm text-slate-400 dark:text-slate-400">{practice.title}</p>
      </div>

      {/* Scores */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row items-center gap-8">
        <div className="shrink-0 lg:border-r border-slate-100 dark:border-slate-800/60 lg:pr-8">
          <ScoreRing score={result.score} label="Overall Score" colorClass="stroke-indigo-600 dark:stroke-indigo-500" size={150} strokeWidth={12} sizeClass="w-28 h-28 sm:w-[150px] sm:h-[150px]" valueClass="text-3xl sm:text-4xl" />
        </div>
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          {subScores.map((s) => (
            <div key={s.label} className="flex justify-center bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-900/50">
              <ScoreRing score={s.value} label={s.label} colorClass={s.color} size={84} strokeWidth={6} sizeClass="w-16 h-16 sm:w-[84px] sm:h-[84px]" valueClass="text-base sm:text-2xl" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Per-question breakdown */}
        <div className="lg:col-span-2 space-y-4">
          {content.questions.map((q, i) => {
            const pq = result.perQuestion?.[i];
            return (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">
                    {pq?.relevant ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-rose-500" />}
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 leading-snug">{i + 1}. {q}</p>
                </div>
                <div className="pl-7 space-y-2.5">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">You said</span><br />
                    {answers[i]?.trim() ? <span className="italic">"{answers[i]}"</span> : <span className="text-slate-400 italic">(no speech detected)</span>}
                  </p>
                  {pq?.comment && (
                    <p className={cn('text-sm', pq.relevant ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400')}>{pq.comment}</p>
                  )}
                  {content.sampleAnswers?.[i] && (
                    <div className="text-sm text-slate-600 dark:text-slate-300 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/20 rounded-xl p-3 flex gap-2">
                      <MessageSquareQuote className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <span><span className="font-semibold text-indigo-700 dark:text-indigo-300">Model answer: </span>{content.sampleAnswers[i]}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feedback */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> AI Teacher Feedback
            </h3>
            {result.feedback && (
              <p className="p-3.5 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/20 rounded-2xl text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">{result.feedback}</p>
            )}
            {result.improvementTips?.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Improvement Suggestions</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                  {result.improvementTips.map((tip, idx) => <li key={idx} className="leading-relaxed">{tip}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
        <button
          onClick={() => navigate('/speaking/respond', { state: { practice, taskKey, taskLabel } })}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow transition-all"
        >
          <RotateCcw className="w-5 h-5" /> Practice again
        </button>
        <button
          onClick={() => navigate('/speaking')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-105 transition-all"
        >
          Next task <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SpeakingResponseResult;
