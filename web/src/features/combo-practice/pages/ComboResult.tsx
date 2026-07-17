import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Award, CheckCircle2, ChevronRight, Clock, Home, Loader2, RotateCcw, Trophy } from 'lucide-react';
import { cn } from '../../../components/classNames';
import {
  cancelCombo,
  COMBO_BUILDER_ROUTE,
  getFinishedCombo,
  startCombo,
} from '../services/comboSession';

const scoreTone = (score: number) =>
  score >= 80
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : score >= 60
      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

const ComboResult = () => {
  const navigate = useNavigate();
  const [combo, setCombo] = useState(() => getFinishedCombo());

  useEffect(() => {
    if (!combo) navigate(COMBO_BUILDER_ROUTE, { replace: true });
  }, [combo, navigate]);

  // Parts are scored in the background — poll storage until every outcome
  // has resolved so scores fill in live as the AI finishes grading.
  const hasPending = combo?.parts.some((p) => p.outcome?.pending) ?? false;
  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(() => setCombo(getFinishedCombo()), 800);
    return () => clearInterval(timer);
  }, [hasPending]);

  const stats = useMemo(() => {
    if (!combo) return null;
    const scores = combo.parts
      .filter((p) => p.outcome && !p.outcome.pending)
      .map((p) => p.outcome?.score)
      .filter((s): s is number => typeof s === 'number');
    const average = scores.length
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : null;
    const minutes =
      combo.finishedAt
        ? Math.max(1, Math.round((Date.parse(combo.finishedAt) - Date.parse(combo.startedAt)) / 60000))
        : null;
    return { average, minutes, scoredCount: scores.length };
  }, [combo]);

  if (!combo || !stats) return null;

  const skillLabel = combo.skill === 'writing' ? 'Writing' : 'Speaking';
  const skillListRoute = combo.skill === 'writing' ? '/writing' : '/speaking';

  const practiceAgain = () => {
    const launch = startCombo(combo.exam, combo.skill, combo.parts.map((p) => p.key));
    navigate(launch.route, { state: launch.state });
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-300 pb-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/30">
          <Trophy className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Multi-Part Session Complete!</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {combo.exam} {skillLabel} · {combo.parts.length} parts
        </p>
        {hasPending && (
          <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Scoring in progress — results fill in automatically
          </p>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5 text-center">
          <Award className="w-5 h-5 mx-auto mb-2 text-indigo-500" />
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {stats.average !== null ? stats.average : '—'}
          </p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
            {stats.average !== null
              ? `Average score (${stats.scoredCount} scored)`
              : 'Scores in part details'}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5 text-center">
          <Clock className="w-5 h-5 mx-auto mb-2 text-indigo-500" />
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {stats.minutes !== null ? `${stats.minutes} min` : '—'}
          </p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Total time</p>
        </div>
      </div>

      {/* Per-part breakdown */}
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Part results</p>
      <div className="space-y-3 mb-10">
        {combo.parts.map((part, index) => {
          const outcome = part.outcome;
          const pending = outcome?.pending === true;
          const failed = outcome?.error === true;
          const hasDetails = Boolean(outcome && !pending && !failed && outcome.resultState != null);
          return (
            <div key={part.key} className="glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-4">
              <span
                className={cn(
                  'w-8 h-8 shrink-0 rounded-full flex items-center justify-center',
                  pending
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500'
                    : failed
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                )}
              >
                {pending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : failed ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                  <span>Part {index + 1} · {part.label}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                    {part.question}
                  </span>
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {failed ? 'Scoring failed — this part has no result.' : outcome?.title}
                </p>
              </div>
              {pending ? (
                <span className="shrink-0 text-sm font-semibold text-indigo-500">Scoring…</span>
              ) : (
                <>
                  {typeof outcome?.score === 'number' && (
                    <span className={cn('px-2.5 py-1 rounded-lg text-sm font-bold shrink-0', scoreTone(outcome.score))}>
                      {outcome.score}
                    </span>
                  )}
                  {hasDetails && (
                    <button
                      onClick={() => navigate(part.resultRoute, { state: outcome?.resultState })}
                      className="shrink-0 flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                      Details <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={practiceAgain}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Practice again
        </button>
        <button
          onClick={() => {
            cancelCombo();
            navigate(skillListRoute);
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          <Home className="w-4 h-4" /> Done
        </button>
      </div>
    </div>
  );
};

export default ComboResult;
