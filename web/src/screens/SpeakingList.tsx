import { useState, useRef, useMemo, useEffect } from 'react';
import { Play, Volume2, Image, MessagesSquare, Table2, Megaphone, UserRound, MessageCircle, Timer, Target, Settings, Mic2 } from 'lucide-react';
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

const SPEAKING_TASKS: Record<Exam, { blurb: string; tasks: TaskDef[] }> = {
  TOEIC: {
    blurb: '11 questions · 6 task types. Each answer is scored on pronunciation, intonation, grammar & relevance.',
    tasks: [
      { key: 'read',  label: 'Read Aloud',           q: 'Q1–2',    icon: <Volume2 className="w-4 h-4" />,         section: 'Read a Text Aloud' },
      { key: 'pic',   label: 'Describe a Picture',    q: 'Q3',      icon: <Image className="w-4 h-4" />,           section: 'Describe a Picture' },
      { key: 'resp',  label: 'Respond to Questions',  q: 'Q4–6',    icon: <MessagesSquare className="w-4 h-4" />,  section: 'Respond to Questions' },
      { key: 'info',  label: 'Respond Using Info',    q: 'Q7–9',    icon: <Table2 className="w-4 h-4" />,          section: 'Respond Using Information' },
      { key: 'op',    label: 'Express an Opinion',    q: 'Q11',     icon: <Megaphone className="w-4 h-4" />,       section: 'Express an Opinion' },
    ],
  },
  IELTS: {
    blurb: '3 parts. Scored by band (0–9) on Fluency, Lexical Resource, Grammar & Pronunciation.',
    tasks: [
      { key: 'p1', label: 'Part 1 · Interview', q: '4–5 min', icon: <UserRound className="w-4 h-4" />, section: 'Part 1 - Introduction and Interview' },
      { key: 'p2', label: 'Part 2 · Long Turn', q: '3–4 min', icon: <Mic2 className="w-4 h-4" />, section: 'Part 2 - Long Turn' },
      { key: 'p3', label: 'Part 3 · Discussion', q: '4–5 min', icon: <MessageCircle className="w-4 h-4" />, section: 'Part 3 - Discussion' },
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

const SpeakingList = () => {
  const navigate = useNavigate();
  const { primaryExam } = useSettings();
  const activeExam = primaryExam;
  const [activeTaskKey, setActiveTaskKey] = useState('read');
  const containerRef = useRef<HTMLDivElement>(null);

  const conf = SPEAKING_TASKS[activeExam];
  const activeTask = conf.tasks.find(t => t.key === activeTaskKey) || conf.tasks[0];

  const practices: Practice[] = useMemo(
    () => getExamTopics(activeExam, 'Speaking', activeTask.section),
    [activeExam, activeTask.section]
  );

  const openIeltsPart1Lobby = (selectedTopic?: string) => {
    navigate('/speaking/ielts-p1', selectedTopic ? { state: { selectedTopic } } : undefined);
  };

  const openIeltsPractice = (taskKey: string, selectedTopic?: string) => {
    if (taskKey === 'p1') {
      openIeltsPart1Lobby(selectedTopic);
      return;
    }
    if (taskKey === 'p2') {
      navigate('/speaking/ielts/part-2');
      return;
    }
    if (taskKey === 'p3') {
      navigate('/speaking/ielts/part-3');
    }
  };

  useEffect(() => {
    setActiveTaskKey(SPEAKING_TASKS[activeExam].tasks[0].key);
  }, [activeExam]);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from('.gs-sp-header', { y: 28, autoAlpha: 0, duration: 0.55, ease: 'power3.out' });
    gsap.from('.gs-sp-filters', { y: 16, autoAlpha: 0, duration: 0.45, ease: 'power3.out', delay: 0.15 });
  }, { scope: containerRef });

  useGSAP(() => {
    if (!practices.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from('.gs-sp-card', {
      y: 32, autoAlpha: 1, scale: 0.97,
      stagger: { amount: 0.4, from: 'start' },
      duration: 0.45, ease: 'back.out(1.4)',
    });
  }, { scope: containerRef, dependencies: [practices] });

  if (activeExam === 'IELTS') {
    const ieltsParts = [
      {
        key: 'p1',
        title: 'IELTS Speaking Part 1',
        subtitle: 'Introduction and Interview',
        description: 'Answer short questions about familiar topics. Choose topics inside the Part 1 practice lobby.',
        duration: '4-5 minutes',
        icon: <UserRound className="w-5 h-5" />,
        action: () => navigate('/speaking/ielts-p1'),
      },
      {
        key: 'p2',
        title: 'IELTS Speaking Part 2',
        subtitle: 'Long Turn',
        description: 'Prepare for 60 seconds, speak from a cue card, then answer short rounding-off questions.',
        duration: '3-4 minutes',
        icon: <Mic2 className="w-5 h-5" />,
        action: () => navigate('/speaking/ielts/part-2'),
      },
      {
        key: 'p3',
        title: 'IELTS Speaking Part 3',
        subtitle: 'Discussion',
        description: 'Practise broader, more abstract questions linked to common IELTS Speaking themes.',
        duration: '4-5 minutes',
        icon: <MessageCircle className="w-5 h-5" />,
        action: () => navigate('/speaking/ielts/part-3'),
      },
    ];

    return (
      <div ref={containerRef} className="animate-in fade-in duration-300">
        <div className="gs-sp-header flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">IELTS Speaking</h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl">
              Practice the IELTS Speaking test by part. Part 1 topics are managed inside the Part 1 lobby, so this page stays focused on the three-part structure.
            </p>
          </div>
          <button
            onClick={() => navigate('/speaking/ielts')}
            className="hidden sm:flex items-center justify-center gap-2 shrink-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-105 transition-all"
          >
            <MessageCircle className="w-4 h-4" /> IELTS Overview
          </button>
        </div>

        <div className="gs-sp-filters flex items-center gap-3 mb-7">
          <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-semibold">
            <Target className="w-4 h-4" /> IELTS
            <span className="text-indigo-400 dark:text-indigo-400/80 font-medium hidden md:inline">Academic & General</span>
          </span>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="text-sm text-slate-400 dark:text-slate-500 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" /> Change in Settings
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {ieltsParts.map((part) => (
            <button
              key={part.key}
              onClick={part.action}
              className="group text-left glass-card rounded-2xl shadow p-5 sm:p-6 border border-transparent hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full min-h-[260px]"
            >
              <div className="flex items-start justify-between mb-5">
                <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  {part.icon}
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] px-2 py-1 rounded-md font-semibold flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5" /> {part.duration}
                </span>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{part.subtitle}</p>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{part.title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{part.description}</p>
              <span className="mt-auto w-full flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white py-3 rounded-xl font-semibold transition-colors">
                <Play className="w-4 h-4 fill-current" /> Start Practice
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="animate-in fade-in duration-300">
      <div className="gs-sp-header flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Speaking Practice</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl">{conf.blurb}</p>
        </div>
        <button
          onClick={() => navigate('/shadowing/mock-dialogue')}
          className="hidden sm:flex items-center justify-center gap-2 shrink-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-105 transition-all"
        >
          <MessageCircle className="w-4 h-4" /> Mock Interview
        </button>
      </div>

      <div className="gs-sp-filters space-y-5 mb-7">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-semibold">
            <Target className="w-4 h-4" /> {activeExam}
            <span className="text-indigo-400 dark:text-indigo-400/80 font-medium hidden md:inline">· {activeExam === 'TOEIC' ? 'Speaking & Writing format' : 'Academic & General'}</span>
          </span>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="text-sm text-slate-400 dark:text-slate-500 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5"
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
                onClick={() => {
                  if (t.key === 'pic') {
                    navigate('/speaking/picture');
                    return;
                  }
                  setActiveTaskKey(t.key);
                }}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold transition border shrink-0 whitespace-nowrap',
                  on
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
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
        <span className="text-indigo-500">{activeTask.icon}</span>
        <span className="font-bold text-slate-700 dark:text-slate-200">{activeTask.label}</span>
        <span className="text-slate-400 dark:text-slate-500">· {practices.length} practice sets</span>
      </div>

      {practices.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {practices.map((practice) => (
            <div
              key={practice.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (activeTaskKey === 'p1') {
                  openIeltsPart1Lobby(practice.title);
                  return;
                }
                if (activeTaskKey === 'p2' || activeTaskKey === 'p3') {
                  openIeltsPractice(activeTaskKey, practice.title);
                  return;
                }
                const state = { practice, exam: activeExam, taskKey: activeTaskKey, taskLabel: activeTask.label };
                const route = activeTaskKey === 'pic' ? '/speaking/picture' : '/speaking/record';
                navigate(route, { state });
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  if (activeTaskKey === 'p1') {
                    openIeltsPart1Lobby(practice.title);
                    return;
                  }
                  if (activeTaskKey === 'p2' || activeTaskKey === 'p3') {
                    openIeltsPractice(activeTaskKey, practice.title);
                    return;
                  }
                  const state = { practice, exam: activeExam, taskKey: activeTaskKey, taskLabel: activeTask.label };
                  const route = activeTaskKey === 'pic' ? '/speaking/picture' : '/speaking/record';
                  navigate(route, { state });
                }
              }}
              className="gs-sp-card glass-card rounded-2xl shadow p-5 sm:p-6 border border-transparent hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
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

              <h3 className="text-lg sm:text-xl font-bold mb-1.5 leading-snug">{practice.title}</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mb-5">{practice.type}</p>

              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6 mt-auto">
                <Timer className="w-4 h-4" /> {practice.duration}
              </div>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  if (activeTaskKey === 'p1') {
                    openIeltsPart1Lobby(practice.title);
                    return;
                  }
                  if (activeTaskKey === 'p2' || activeTaskKey === 'p3') {
                    openIeltsPractice(activeTaskKey, practice.title);
                    return;
                  }
                  const state = { practice, exam: activeExam, taskKey: activeTaskKey, taskLabel: activeTask.label };
                  const route = activeTaskKey === 'pic' ? '/speaking/picture' : '/speaking/record';
                  navigate(route, { state });
                }}
                className="w-full flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 py-3 rounded-xl font-semibold transition-colors"
              >
                <Play className="w-4 h-4 fill-current" /> Start Task
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

export default SpeakingList;
