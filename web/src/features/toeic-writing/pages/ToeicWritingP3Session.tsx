import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Circle, Clock, ListChecks, Plus, Send, Sparkles, ThumbsDown, ThumbsUp, Trash2, Type } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { useSettings } from '../../../components/useSettings';
import { useToast } from '../../../components/useToast';
import { generateTeacherFeedback } from '../../../services/ai';
import { getWritingTaskTiming } from '../../../services/examTiming';
import { addHistory } from '../../../services/storage';
import type { Practice } from '../../../services/storage';
import { runComboStepInBackground } from '../../combo-practice/services/comboSession';
import {
  ESSAY_MIN_WORDS,
  buildEssayChecklist,
  classifyQuestionType,
  countWords,
  questionTypeHint,
  questionTypeLabel,
} from '../utils/essayAnalysis';
import type { EssayReason, EssayStance } from '../types/toeic-writing.types';

const makeReason = (): EssayReason => ({ id: crypto.randomUUID(), reason: '', example: '' });

const ToeicWritingP3Session = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const toast = useToast();

  const practice = (location.state?.practice as Practice) || {
    id: Date.now(),
    title: 'Some people prefer to work for a large company. Others prefer to work for a small company. Which do you prefer? Use specific reasons and examples to support your answer.',
    type: 'Opinion Essay',
    level: 'Medium',
    duration: '30 mins',
  };
  const questionType = classifyQuestionType(practice.title);

  // ── Planning panel state (reference-only; not sent to the AI) ──────────────
  const [stance, setStance] = useState<EssayStance>('undecided');
  const [reasons, setReasons] = useState<EssayReason[]>([makeReason(), makeReason()]);
  const [notes, setNotes] = useState('');

  // ── Editor state ──────────────────────────────────────────────────────────
  const [text, setText] = useState('');
  const wordCount = countWords(text);
  const checklist = buildEssayChecklist(text);

  const officialTiming = getWritingTaskTiming('TOEIC', 'essay');
  const [timer, setTimer] = useState(officialTiming?.totalSeconds ?? 30 * 60);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // ── Timer audio cues (mirrors WritingEditor) ──────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playTone = useCallback((frequency: number, duration: number, peak = 0.16) => {
    try {
      const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtor();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.02);
    } catch { /* Web Audio unavailable */ }
  }, []);
  const playTick = useCallback(() => playTone(880, 0.12), [playTone]);
  const playEndBeep = useCallback(() => playTone(440, 0.7, 0.22), [playTone]);
  const playNotification = useCallback((double = false) => {
    playTone(660, 0.18, 0.18);
    if (double) setTimeout(() => playTone(660, 0.18, 0.18), 270);
  }, [playTone]);

  useEffect(() => {
    if (isEvaluating) return;
    const t = setInterval(() => setTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [isEvaluating]);

  useEffect(() => {
    if (isEvaluating) return;
    if (timer === 600) playNotification(false);      // 10-minute warning
    else if (timer === 300) playNotification(true);  // 5-minute warning (double beep)
    else if (timer > 0 && timer <= 10) playTick();
    else if (timer === 0) playEndBeep();
  }, [timer, isEvaluating, playTick, playEndBeep, playNotification]);

  useEffect(() => () => { void audioCtxRef.current?.close(); }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const addReason = () => setReasons((prev) => (prev.length >= 3 ? prev : [...prev, makeReason()]));
  const removeReason = (id: string) => setReasons((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  const updateReason = (id: string, field: 'reason' | 'example', value: string) =>
    setReasons((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const handleSubmit = async () => {
    const runEvaluation = async () => {
      const prompt = practice.title;
      // Part 3 is graded with the teacher-style feedback system (0-5 TOEIC
      // rubric) and shown on the shared FeedbackResultPage.
      const result = await generateTeacherFeedback(settings, 'toeic-writing-essay', {
        originalAnswer: text,
        prompt,
        taskKey: 'essay',
      });

      // History stores a 0-100 score; the essay rubric is 0-5, so scale up.
      const score = typeof result.overallScore === 'number'
        ? Math.round(Math.max(0, Math.min(5, result.overallScore)) * 20)
        : 0;
      addHistory({ title: practice.title, type: practice.type, score, focus: 'Writing' });
      return { result, score };
    };

    // Combo mode: move straight to the next part; the AI scores this one in
    // the background and the combined result page fills in when it resolves.
    const comboNext = runComboStepInBackground({
      resultRoute: '/writing/toeic-p3/result',
      title: practice.title,
      evaluate: async () => {
        const { result, score } = await runEvaluation();
        return { score, resultState: { result, practice } };
      },
    });
    if (comboNext) {
      navigate(comboNext.route, { state: comboNext.state });
      return;
    }

    setIsEvaluating(true);
    try {
      const { result } = await runEvaluation();
      toast.success('Evaluation completed!');
      navigate('/writing/toeic-p3/result', { state: { result, practice } });
    } catch (e) {
      console.error(e);
      toast.error('Failed to evaluate. Please check API key.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="lg:h-[calc(100dvh-8rem)] flex flex-col pb-32 md:pb-0 animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium">
          ← Exit
        </button>
        <div className="flex gap-2 items-center">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            TOEIC
          </span>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-sm font-semibold">
            Writing · Part 3 · Opinion Essay
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        {/* Prompt + planning panel */}
        <div className="w-full lg:w-2/5 glass-card rounded-3xl p-5 sm:p-6 flex flex-col lg:shrink-0 lg:overflow-y-auto">
          <span className="inline-flex items-center self-start px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mb-2">
            {questionTypeLabel(questionType)}
          </span>
          <h2 className="text-lg font-bold mb-2 leading-snug">{practice.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{questionTypeHint(questionType)}</p>

          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
            <ListChecks className="w-4 h-4 text-blue-500" /> Plan before you write
          </h3>

          {/* Stance picker */}
          <div className="flex gap-2 mb-4">
            {([['agree', 'Agree', ThumbsUp], ['disagree', 'Disagree', ThumbsDown]] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStance((prev) => (prev === value ? 'undecided' : value))}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition',
                  stance === value
                    ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700',
                )}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Reason + example pairs */}
          <div className="space-y-3 mb-3">
            {reasons.map((r, idx) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3 bg-white/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason {idx + 1}</span>
                  {reasons.length > 1 && (
                    <button type="button" onClick={() => removeReason(r.id)} className="text-slate-400 hover:text-red-500" aria-label="Remove reason">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  value={r.reason}
                  onChange={(e) => updateReason(r.id, 'reason', e.target.value)}
                  placeholder="Main point…"
                  className="w-full bg-transparent text-sm font-medium outline-none mb-1.5 placeholder:text-slate-400"
                />
                <input
                  value={r.example}
                  onChange={(e) => updateReason(r.id, 'example', e.target.value)}
                  placeholder="Specific example…"
                  className="w-full bg-transparent text-sm outline-none text-slate-600 dark:text-slate-400 placeholder:text-slate-400"
                />
              </div>
            ))}
          </div>

          {reasons.length < 3 && (
            <button
              type="button"
              onClick={addReason}
              className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mb-4"
            >
              <Plus className="w-3.5 h-3.5" /> Add reason
            </button>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Outline notes (intro hook, conclusion idea…)"
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/40 p-3 text-sm outline-none resize-none h-20 placeholder:text-slate-400 mb-5"
          />

          <h3 className="font-bold mb-3 text-sm">Checklist</h3>
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                {item.done ? <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />}
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Editor */}
        <div className="flex-1 glass-card rounded-3xl overflow-hidden flex flex-col relative border border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="h-14 border-b border-[var(--border)] px-6 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50">
            <span className={cn('flex items-center gap-1.5 text-sm font-semibold', wordCount >= ESSAY_MIN_WORDS ? 'text-green-600 dark:text-green-400' : 'text-slate-500')}>
              <Type className="w-4 h-4" /> {wordCount} / {ESSAY_MIN_WORDS} words
            </span>
            <div className={cn(
              'flex items-center gap-2 text-sm font-bold transition-colors duration-300',
              timer <= 10 ? 'text-red-500' : timer <= 300 ? 'text-orange-500' : timer <= 600 ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400',
            )}>
              <Clock className={cn('w-4 h-4', timer <= 300 && 'animate-pulse')} />
              <span key={timer <= 10 ? timer : 'calm'} className={cn(timer > 0 && timer <= 10 && 'animate-timer-shake')}>
                {formatTime(timer)}
              </span>
            </div>
          </div>

          <textarea
            className="flex-1 min-h-[42vh] lg:min-h-0 w-full bg-transparent p-5 sm:p-6 resize-none outline-none text-base sm:text-lg leading-relaxed text-[var(--foreground)] placeholder:text-slate-400"
            placeholder="In my opinion, …"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            spellCheck={false}
          />

          <div className="hidden md:flex p-4 border-t border-[var(--border)] bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur shrink-0 items-center justify-between gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI examiner ready
            </span>
            <button
              onClick={handleSubmit}
              disabled={wordCount < 10 || isEvaluating}
              className={cn(
                'flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-md transition-all',
                wordCount >= 10 && !isEvaluating
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed',
              )}
            >
              {isEvaluating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin" /> Evaluating...
                </>
              ) : (
                <>Submit for Score <Send className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed inset-x-0 bottom-[78px] z-30 px-4 pt-4 pb-2 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent">
        <button
          onClick={handleSubmit}
          disabled={wordCount < 10 || isEvaluating}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold shadow-lg transition-all',
            wordCount >= 10 && !isEvaluating
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed',
          )}
        >
          {isEvaluating ? (
            <>
              <div className="w-4 h-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin" /> Evaluating...
            </>
          ) : (
            <>Submit for Score <Send className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
};

export default ToeicWritingP3Session;
