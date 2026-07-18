import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Briefcase, Bus, ChevronRight, Clock, Cpu, FileText, GraduationCap,
  LayoutGrid, PenTool, ShoppingBag, Shuffle, Target, Wallet, type LucideIcon,
} from 'lucide-react';
import { cn } from '../../../components/classNames';
import { getExamTopics } from '../../../services/localData';
import type { Practice } from '../../../services/storage';
import type { EssayTheme } from '../types/toeic-writing.types';
import { classifyQuestionType, questionTypeLabel } from '../utils/essayAnalysis';
import { ESSAY_THEMES, classifyTheme } from '../utils/essayThemes';

const THEME_ICONS: Record<EssayTheme, LucideIcon> = {
  workplace: Briefcase,
  'business-consumer': ShoppingBag,
  technology: Cpu,
  'education-career': GraduationCap,
  money: Wallet,
  'city-environment': Bus,
};

const STATS: [string, string][] = [
  ['1', 'question'],
  ['30', 'minutes'],
  ['~300', 'words'],
  ['0–5', 'scored'],
];

const STRUCTURE = [
  { title: 'Introduction', text: 'Restate the topic and give a clear thesis stating your position.' },
  { title: 'Body 1 + Body 2', text: 'One reason per paragraph: topic sentence, explanation, specific example.' },
  { title: 'Conclusion', text: 'Restate your opinion and end with a strong closing thought.' },
];

const RUBRIC = [
  ['5', 'Compelling reasoning, varied vocabulary, almost no grammar errors.'],
  ['4', 'Adequate arguments with examples, logical organisation, minor errors.'],
  ['3', 'Basic ideas, few examples, unclear organisation, simple vocabulary.'],
  ['2–0', 'Few/no examples, weak vocabulary, off-topic or very limited.'],
];

const ToeicWritingP3Overview = () => {
  const navigate = useNavigate();
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [activeTheme, setActiveTheme] = useState<EssayTheme | 'all'>('all');

  const allPrompts: Practice[] = useMemo(
    () => getExamTopics('TOEIC', 'Writing', 'Write an Opinion Essay'),
    [],
  );

  // How many prompts fall under each theme — drives the topic chips + counts.
  const themeCounts = useMemo(() => {
    const counts = {} as Record<EssayTheme, number>;
    for (const practice of allPrompts) {
      const theme = classifyTheme(practice.title);
      counts[theme] = (counts[theme] ?? 0) + 1;
    }
    return counts;
  }, [allPrompts]);

  const themedPrompts: Practice[] = useMemo(
    () =>
      activeTheme === 'all'
        ? allPrompts
        : allPrompts.filter((practice) => classifyTheme(practice.title) === activeTheme),
    [allPrompts, activeTheme],
  );

  const prompts: Practice[] = useMemo(() => {
    void shuffleSeed;
    if (themedPrompts.length <= 12) return themedPrompts;
    return [...themedPrompts].sort(() => 0.5 - Math.random()).slice(0, 12);
  }, [themedPrompts, shuffleSeed]);

  const startSession = (practice: Practice) =>
    navigate('/writing/toeic-p3/session', { state: { practice } });

  const chipClass = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors',
      active
        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
        : 'glass-card border-transparent text-slate-600 dark:text-slate-300 hover:border-blue-200 dark:hover:border-blue-800/60',
    );

  const countClass = (active: boolean) =>
    cn(
      'px-1.5 py-0.5 rounded-md text-[10px] tabular-nums',
      active ? 'bg-white/20' : 'bg-slate-200/70 text-slate-500 dark:bg-slate-700/70 dark:text-slate-300',
    );

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      <button
        onClick={() => navigate('/writing')}
        className="text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white mb-5"
      >
        ← Back to Writing
      </button>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" /> TOEIC Writing · Part 3
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 mb-3">
            Write an Opinion Essay
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Question 8 asks you to take a position on a familiar statement and defend it with reasons
            and specific examples. You get 30 minutes to plan, write, and revise an essay of roughly
            300 words.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map(([value, label]) => (
            <div key={label} className="glass-card rounded-2xl p-4 text-center border border-transparent">
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{value}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-bold">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Structure + rubric */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="glass-card rounded-2xl p-5 border border-transparent">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" /> Essay structure
          </h2>
          <ul className="space-y-3">
            {STRUCTURE.map((item) => (
              <li key={item.title} className="flex gap-3">
                <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-transparent">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-500" /> Scoring (0–5)
          </h2>
          <ul className="space-y-2.5">
            {RUBRIC.map(([score, desc]) => (
              <li key={score} className="flex gap-3 items-start">
                <span className="shrink-0 w-9 text-center font-black text-orange-500">{score}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Topic picker */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm">
          <LayoutGrid className="w-4 h-4 text-blue-500" />
          <span className="font-bold text-slate-700 dark:text-slate-200">Choose a topic</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setActiveTheme('all')} className={chipClass(activeTheme === 'all')}>
            <LayoutGrid className="w-3.5 h-3.5" /> All topics
            <span className={countClass(activeTheme === 'all')}>{allPrompts.length}</span>
          </button>
          {ESSAY_THEMES.filter((theme) => (themeCounts[theme.id] ?? 0) > 0).map((theme) => {
            const Icon = THEME_ICONS[theme.id];
            const active = activeTheme === theme.id;
            return (
              <button key={theme.id} type="button" onClick={() => setActiveTheme(theme.id)} className={chipClass(active)}>
                <Icon className="w-3.5 h-3.5" /> {theme.label}
                <span className={countClass(active)}>{themeCounts[theme.id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt picker */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <PenTool className="w-4 h-4 text-blue-500" />
        <span className="font-bold text-slate-700 dark:text-slate-200">Choose a prompt</span>
        <span className="text-slate-400 dark:text-slate-500">
          · {prompts.length < themedPrompts.length ? `${prompts.length} of ${themedPrompts.length}` : prompts.length}
        </span>
        {prompts.length < themedPrompts.length && (
          <button
            type="button"
            onClick={() => setShuffleSeed((s) => s + 1)}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" /> Shuffle
          </button>
        )}
      </div>

      {prompts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {prompts.map((practice) => {
            const type = classifyQuestionType(practice.title);
            return (
              <button
                key={practice.id}
                onClick={() => startSession(practice)}
                className="group text-left glass-card rounded-2xl p-5 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/60 hover:-translate-y-1 transition-all flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {questionTypeLabel(type)}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
                    practice.level === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      practice.level === 'Medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                  )}>
                    {practice.level}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug mb-4 flex-1">
                  {practice.shortTitle || practice.title}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> {practice.duration}
                  <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-blue-500 transition-colors" />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400">No opinion essay prompts available.</p>
        </div>
      )}
    </div>
  );
};

export default ToeicWritingP3Overview;
