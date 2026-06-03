import { useState, useRef, useMemo, useEffect } from 'react';
import { PenTool, Clock, Image, Mail, FileText, BarChart3, Target, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../components/classNames';
import { useSettings } from '../components/useSettings';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getExamTopics } from '../services/localData';
import type { Practice } from '../services/storage';

type Exam = 'TOEIC' | 'IELTS';

interface TaskDef {
  key: string;
  label: string;
  q: string;
  icon: React.ReactNode;
  section: string;
}

const WRITING_TASKS: Record<Exam, { blurb: string; tasks: TaskDef[] }> = {
  TOEIC: {
    blurb: '8 questions · 3 task types. Scored on grammar, vocabulary, organisation & whether you answer the task.',
    tasks: [
      { key: 'pic',   label: 'Describe a Picture',   q: 'Practice', icon: <Image className="w-4 h-4" />,    section: 'Describe a Picture' },
      { key: 'sent',  label: 'Write a Sentence',      q: 'Q1–5',  icon: <Image className="w-4 h-4" />,    section: 'Write a Sentence Based on a Picture' },
      { key: 'email', label: 'Respond to a Request',   q: 'Q6–7',  icon: <Mail className="w-4 h-4" />,     section: 'Respond to a Written Request' },
      { key: 'essay', label: 'Opinion Essay',           q: 'Q8',    icon: <FileText className="w-4 h-4" />, section: 'Write an Opinion Essay' },
    ],
  },
  IELTS: {
    blurb: 'Two tasks. Scored by band (0–9) on Task Achievement, Coherence, Lexical Resource & Grammar.',
    tasks: [
      { key: 't1a', label: 'Task 1 · Academic', q: 'Chart',  icon: <BarChart3 className="w-4 h-4" />, section: 'Task 1 Academic' },
      { key: 't1g', label: 'Task 1 · General',  q: 'Letter', icon: <Mail className="w-4 h-4" />,      section: 'Task 1 General' },
      { key: 't2',  label: 'Task 2 · Essay',    q: 'Essay',  icon: <FileText className="w-4 h-4" />,  section: 'Task 2 Essay' },
    ],
  },
};

const ExamPill = ({ exam }: { exam: Exam }) => (
  <span className={cn(
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
    exam === 'TOEIC' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
  )}>
    {exam}
  </span>
);

const WritingList = () => {
  const navigate = useNavigate();
  const { primaryExam } = useSettings();
  const activeExam = primaryExam;
  const [activeTaskKey, setActiveTaskKey] = useState('t1a');
  const containerRef = useRef<HTMLDivElement>(null);

  const conf = WRITING_TASKS[activeExam];
  const activeTask = conf.tasks.find(t => t.key === activeTaskKey) || conf.tasks[0];

  const practices: Practice[] = useMemo(() => {
    const writingTopics = getExamTopics(activeExam, 'Writing', activeTask.section);
    if (activeExam === 'TOEIC' && activeTask.key === 'pic' && writingTopics.length === 0) {
      return getExamTopics('TOEIC', 'Speaking', 'Describe a Picture').map((practice) => ({
        ...practice,
        type: 'Picture Description · Writing',
        duration: '8 mins',
      }));
    }
    return writingTopics;
  }, [activeExam, activeTask.key, activeTask.section]);

  useEffect(() => {
    setActiveTaskKey(WRITING_TASKS[activeExam].tasks[0].key);
  }, [activeExam]);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from('.gs-wr-header', { y: 28, autoAlpha: 0, duration: 0.55, ease: 'power3.out' });
    gsap.from('.gs-wr-filters', { y: 16, autoAlpha: 0, duration: 0.45, ease: 'power3.out', delay: 0.15 });
  }, { scope: containerRef });

  useGSAP(() => {
    if (!practices.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from('.gs-wr-card', {
      y: 32, autoAlpha: 1, scale: 0.97,
      stagger: { amount: 0.4, from: 'start' },
      duration: 0.45, ease: 'back.out(1.4)',
    });
  }, { scope: containerRef, dependencies: [practices] });

  return (
    <div ref={containerRef} className="animate-in fade-in duration-300">
      <div className="gs-wr-header mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Writing Practice</h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl">{conf.blurb}</p>
      </div>

      <div className="gs-wr-filters space-y-5 mb-7">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-xl text-sm font-semibold">
            <Target className="w-4 h-4" /> {activeExam}
            <span className="text-orange-400 dark:text-orange-400/80 font-medium hidden md:inline">· {activeExam === 'TOEIC' ? 'TOEIC Writing Test' : 'Academic & General Training'}</span>
          </span>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="text-sm text-slate-400 dark:text-slate-500 font-medium hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" /> Change in Settings
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {conf.tasks.map((t) => {
            const on = activeTaskKey === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTaskKey(t.key)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold transition border shrink-0 whitespace-nowrap',
                  on
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                )}
              >
                {t.icon}
                {t.label}
                <span className={cn('hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded', on ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500')}>
                  {t.q}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 text-sm">
        <span className="text-orange-500">{activeTask.icon}</span>
        <span className="font-bold text-slate-700 dark:text-slate-200">{activeTask.label}</span>
        <span className="text-slate-400 dark:text-slate-500">· {practices.length} prompts</span>
      </div>

      {practices.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {practices.map((practice) => (
            <div
              key={practice.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate('/writing/editor', { state: { practice, exam: activeExam, taskKey: activeTaskKey, taskLabel: activeTask.label } })}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate('/writing/editor', { state: { practice, exam: activeExam, taskKey: activeTaskKey, taskLabel: activeTask.label } });
                }
              }}
              className="gs-wr-card glass-card rounded-2xl shadow p-5 sm:p-6 border border-transparent hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <ExamPill exam={activeExam} />
                  <span className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider',
                    practice.level === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      practice.level === 'Medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  )}>
                    {practice.level}
                  </span>
                </div>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] px-2 py-1 rounded-md font-semibold flex items-center gap-1.5">
                  {activeTask.icon}
                  {activeTask.q}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold mb-1.5 leading-snug">{practice.shortTitle || practice.title}</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mb-5">{practice.type}</p>

              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6 mt-auto">
                <Clock className="w-4 h-4" /> {practice.duration}
              </div>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  navigate('/writing/editor', { state: { practice, exam: activeExam, taskKey: activeTaskKey, taskLabel: activeTask.label } });
                }}
                className="w-full flex items-center justify-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-500 py-3 rounded-xl font-semibold transition-colors"
              >
                <PenTool className="w-4 h-4" /> Start Task
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📭</span>
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No topics found</h3>
          <p className="text-slate-500 dark:text-slate-400">No topics available for this section.</p>
        </div>
      )}
    </div>
  );
};

export default WritingList;
