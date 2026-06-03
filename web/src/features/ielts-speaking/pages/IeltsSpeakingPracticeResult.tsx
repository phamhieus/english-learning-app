import { AlertCircle, BookOpen, Home, Info, Mic2, RotateCcw, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../../components/classNames';
import { evaluatePart2Practice, evaluatePart3Practice } from '../utils/sessionEvaluation';

interface AnswerRow {
  label: string;
  question?: string;
  transcript: string;
  score: number | null;
}

function formatBand(band: number | null | undefined) {
  return band == null ? '-' : band.toFixed(1);
}

function bandColor(band: number | null | undefined) {
  if (band == null) return 'text-slate-400';
  if (band >= 7) return 'text-emerald-600 dark:text-emerald-400';
  if (band >= 6) return 'text-teal-600 dark:text-teal-400';
  return 'text-amber-600 dark:text-amber-400';
}

const IeltsSpeakingPracticeResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;

  if (!state?.part) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-3">
        <AlertCircle className="w-10 h-10 text-amber-500" />
        <p className="font-semibold text-slate-700 dark:text-slate-200">No IELTS Speaking result found</p>
        <button onClick={() => navigate('/speaking/ielts')} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold">
          Back to IELTS Speaking
        </button>
      </div>
    );
  }

  const result =
    state.part === 'part_2'
      ? evaluatePart2Practice({
          cueCardTitle: state.cueCard.title,
          durationSeconds: state.durationSeconds,
          longTurn: state.longTurn,
          roundingOff: state.roundingOff ?? [],
        })
      : evaluatePart3Practice({
          theme: state.discussionSet.theme,
          durationSeconds: state.durationSeconds,
          answers: state.answers ?? [],
        });

  const criteria = Object.entries(result.criteria);
  let answerRows: AnswerRow[];
  if ('longTurnResult' in result) {
    answerRows = [
      { label: 'Long turn', question: state.longTurn?.question, transcript: result.longTurnResult.transcript, score: result.longTurnResult.quickScore },
      ...result.roundingOffResults.map((answer, index) => ({
        label: `Rounding-off ${index + 1}`,
        question: answer.question,
        transcript: answer.transcript,
        score: answer.quickScore,
      })),
    ];
  } else {
    answerRows = result.questionResults.map((answer, index) => ({
      label: `Question ${index + 1}`,
      question: answer.question,
      transcript: answer.transcript,
      score: answer.quickScore,
    }));
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center mb-8">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Session Complete</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{result.sessionTitle}</h1>
        <p className="text-sm text-slate-400 mt-1">{result.durationSeconds}s total practice time</p>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 p-6 text-center mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          {state.part === 'part_2' ? 'Estimated Part 2 Practice Band' : 'Estimated Part 3 Practice Band'}
        </p>
        <p className={cn('text-7xl font-black tabular-nums mb-3', bandColor(result.estimatedBand))}>{formatBand(result.estimatedBand)}</p>
        <div className="flex items-start justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>{result.disclaimer}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {criteria.map(([key, value]) => (
          <div key={key} className="glass-card rounded-2xl p-3 text-center border border-transparent">
            <div className="text-slate-400 flex justify-center mb-1">
              {key === 'pronunciation' ? <Mic2 className="w-4 h-4" /> : key === 'lexicalResource' ? <BookOpen className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <p className={cn('text-2xl font-black tabular-nums', bandColor(value.estimatedBand))}>{formatBand(value.estimatedBand)}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">{key.replace(/([A-Z])/g, ' $1')}</p>
          </div>
        ))}
      </div>

      <section className="mb-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Coaching Insights</h2>
        <div className="glass-card rounded-2xl p-4 border border-transparent">
          {result.coachingInsights.map((insight) => (
            <div key={insight.key} className="py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{insight.label}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{insight.message}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">These coaching insights are practice guidance, not official IELTS criteria.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Answer Review</h2>
        <div className="space-y-3">
          {answerRows.map((answer) => (
            <div key={answer.label} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{answer.label}</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{answer.question}</p>
                </div>
                <span className={cn('text-xl font-black tabular-nums', bandColor(answer.score))}>{formatBand(answer.score)}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">{answer.transcript || '(no speech detected)'}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => navigate(state.part === 'part_2' ? '/speaking/ielts/part-2' : '/speaking/ielts/part-3')} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
          <RotateCcw className="w-4 h-4" /> Practice Again
        </button>
        <button onClick={() => navigate('/speaking/ielts')} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
          <Home className="w-4 h-4" /> Back to IELTS Speaking
        </button>
      </div>
    </div>
  );
};

export default IeltsSpeakingPracticeResult;
