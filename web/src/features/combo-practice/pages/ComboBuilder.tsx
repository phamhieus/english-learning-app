import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Layers, Play, RotateCcw, Target, Timer, Trash2 } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { useSettings } from '../../../components/useSettings';
import {
  cancelCombo,
  getActiveCombo,
  getComboParts,
  resumeCombo,
  startCombo,
} from '../services/comboSession';
import type { ComboPartKey, ComboSkill } from '../types/combo-practice.types';

const SKILL_LABEL: Record<ComboSkill, string> = {
  speaking: 'Speaking',
  writing: 'Writing',
};

const ComboBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { primaryExam } = useSettings();

  const skill: ComboSkill = searchParams.get('skill') === 'writing' ? 'writing' : 'speaking';
  const parts = useMemo(() => getComboParts(primaryExam, skill), [primaryExam, skill]);

  const [selected, setSelected] = useState<ComboPartKey[]>(
    () => parts.filter((p) => p.defaultSelected).map((p) => p.key),
  );
  // Bumped after discarding an unfinished session so the resume card unmounts.
  const [sessionVersion, setSessionVersion] = useState(0);

  const activeCombo = useMemo(() => {
    void sessionVersion;
    return getActiveCombo();
  }, [sessionVersion]);

  const toggle = (key: ComboPartKey) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const canStart = selected.length >= 2;

  const handleStart = () => {
    if (!canStart) return;
    const launch = startCombo(primaryExam, skill, selected);
    navigate(launch.route, { state: launch.state });
  };

  const handleResume = () => {
    const launch = resumeCombo();
    if (launch) navigate(launch.route, { state: launch.state });
  };

  const backRoute = skill === 'writing' ? '/writing' : '/speaking';

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
      <button
        onClick={() => navigate(backRoute)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-6 h-6" />
            </span>
            Multi-Part {SKILL_LABEL[skill]} Test
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl">
            Combine several parts into one continuous session, just like the real test.
            Each part gets a random prompt and flows straight into the next — your combined
            results appear at the end.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-7 mt-5">
        <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-semibold">
          <Target className="w-4 h-4" /> {primaryExam} {SKILL_LABEL[skill]}
        </span>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="text-sm text-slate-400 dark:text-slate-500 font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          Change exam in Settings
        </button>
      </div>

      {activeCombo && (
        <div className="glass-card rounded-2xl p-5 mb-6 border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-900/10">
          <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">
            Unfinished multi-part session
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {activeCombo.exam} {SKILL_LABEL[activeCombo.skill]} · Part {activeCombo.currentIndex + 1} of{' '}
            {activeCombo.parts.length} · {activeCombo.parts[activeCombo.currentIndex]?.label}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleResume}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Resume
            </button>
            <button
              onClick={() => {
                cancelCombo();
                setSessionVersion((v) => v + 1);
              }}
              className="flex-1 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Discard
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Choose parts · in test order
        </p>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {selected.length} of {parts.length} selected
        </span>
      </div>

      <div className="space-y-3 mb-8">
        {parts.map((part, index) => {
          const on = selected.includes(part.key);
          return (
            <button
              key={part.key}
              type="button"
              onClick={() => toggle(part.key)}
              className={cn(
                'w-full text-left glass-card rounded-2xl p-4 sm:p-5 border transition-all flex items-center gap-4',
                on
                  ? 'border-indigo-300 dark:border-indigo-700 shadow-md shadow-indigo-500/10'
                  : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <span
                className={cn(
                  'w-6 h-6 shrink-0 rounded-lg flex items-center justify-center border-2 transition-colors',
                  on
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 text-transparent',
                )}
              >
                <Check className="w-4 h-4" />
              </span>
              <span className="w-8 h-8 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 dark:text-slate-100">{part.label}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                    {part.question}
                  </span>
                </span>
                <span className="block text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {part.description}
                </span>
              </span>
              <span className="hidden sm:flex items-center gap-1.5 shrink-0 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                <Timer className="w-3.5 h-3.5" /> {part.durationLabel}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleStart}
        disabled={!canStart}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all',
          canStart
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99]'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed',
        )}
      >
        <Play className="w-5 h-5 fill-current" />
        {canStart ? `Start ${selected.length}-part session` : 'Select at least 2 parts'}
      </button>
    </div>
  );
};

export default ComboBuilder;
