import { useMemo, useRef, useState } from 'react';
import {
  Wand2, Type, Pilcrow, MessagesSquare, Clapperboard,
  Play, Check, Activity, Upload, Link, Sparkles, Plus, FileText,
  Quote, Clock, AlignLeft, CheckCircle2, Circle, Search,
  BadgeCheck, Folder,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../components/classNames';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getLessonsByMode, getLessonProgress, type ShadowingMode } from '../services/shadowingData';
import type { ShadowingLesson } from '../features/shadowing/types/shadowing.types';
import { VideoLessonCard, type LessonCardData } from '../features/video-shadowing/components/VideoLessonCard';
import { useVideoShadowingLibrary } from '../features/video-shadowing/hooks/useVideoShadowingLibrary';
import { getVoaCategories, type BuiltInVoaLesson } from '../features/video-shadowing/services/video-source/builtInVoaResolver';
import { gradForId } from '../features/video-shadowing/components/videoThumbStyles';
import type { VideoShadowingLesson } from '../features/video-shadowing/models/lesson';

interface ShadowModeConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  desc: string;
}

const SHADOW_MODES: ShadowModeConfig[] = [
  { key: 'free',      label: 'Free Topic',  icon: <Wand2 className="w-5 h-5" />,         iconBg: 'bg-fuchsia-500', desc: 'Paste any text or pick a topic'     },
  { key: 'sentence',  label: 'Sentence',    icon: <Type className="w-5 h-5" />,           iconBg: 'bg-indigo-500',  desc: 'Drill one short sentence at a time' },
  { key: 'paragraph', label: 'Paragraph',   icon: <Pilcrow className="w-5 h-5" />,        iconBg: 'bg-violet-500',  desc: 'Longer passages · keep the rhythm'  },
  { key: 'dialogue',  label: 'Dialogue',    icon: <MessagesSquare className="w-5 h-5" />, iconBg: 'bg-cyan-600',    desc: 'Play one role in a 2-person chat'   },
  { key: 'video',     label: 'Video',       icon: <Clapperboard className="w-5 h-5" />,   iconBg: 'bg-orange-500',  desc: 'Shadow VOA or your own uploads'     },
];

// Gradient palette — cycles by lesson index
const GRADIENTS = [
  'linear-gradient(135deg,#6ee7b7,#059669)',
  'linear-gradient(135deg,#fcd34d,#f59e0b)',
  'linear-gradient(135deg,#7dd3fc,#2563eb)',
  'linear-gradient(135deg,#c4b5fd,#7c3aed)',
  'linear-gradient(135deg,#a5b4fc,#4f46e5)',
  'linear-gradient(135deg,#fda4af,#e11d48)',
];

const levelCefr = (level: string) => {
  if (level === 'beginner')     return 'A2';
  if (level === 'intermediate') return 'B1';
  return 'C1';
};

const cefrClass = (lvl: string) => {
  const map: Record<string, string> = {
    A1: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    A2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    B1: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    B2: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    C1: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return map[lvl] ?? 'bg-slate-100 text-slate-600';
};

const ThumbStrip = ({ grad, dur, prog = 0 }: { grad: string; dur: string; prog?: number }) => (
  <div className="relative overflow-hidden aspect-video rounded-t-2xl" style={{ background: grad }}>
    <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.18) 0 2px,transparent 2px 26px)' }} />
    <span className="absolute bottom-3 right-3 z-10 px-2 py-0.5 rounded-md bg-black/55 text-white text-[11px] font-semibold font-mono backdrop-blur-sm">{dur}</span>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-md border border-white/50 flex items-center justify-center shadow-lg">
        <Play className="w-6 h-6 text-white fill-current ml-0.5" />
      </div>
    </div>
    {prog > 0 && prog < 100 && (
      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/25"><div className="h-full bg-white" style={{ width: `${prog}%` }} /></div>
    )}
    {prog >= 100 && (
      <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md">
        <Check className="w-4 h-4" />
      </div>
    )}
  </div>
);

const progressStatus = (prog: number) => {
  if (prog >= 100) return { label: 'Completed', className: 'text-green-600 dark:text-green-400', Icon: CheckCircle2 };
  if (prog > 0) return { label: `${prog}% done`, className: 'text-indigo-500 dark:text-indigo-400', Icon: Activity };
  return { label: 'Not started', className: 'text-slate-400 dark:text-slate-500', Icon: Circle };
};

const LessonPreview = ({ lesson, mode }: { lesson: ShadowingLesson; mode: string }) => {
  if (mode === 'paragraph') {
    const preview = lesson.segments.map(s => s.text).filter(Boolean).slice(0, 2).join(' ');
    return (
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
        <div className="w-9 h-9 rounded-xl bg-violet-500 text-white flex items-center justify-center shadow-sm mb-3">
          <Pilcrow className="w-4 h-4" />
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">
          <span className="text-indigo-300 font-bold text-xl leading-none mr-0.5 align-[-3px]">"</span>
          {preview}
          <span>"</span>
        </p>
      </div>
    );
  }

  if (mode === 'dialogue') {
    const lines = lesson.segments.filter(s => Boolean(s.text)).slice(0, 2).map(s => s.text);
    return (
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
        <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-sm mb-3">
          <MessagesSquare className="w-4 h-4" />
        </div>
        <div className="flex min-h-[64px] flex-col justify-center gap-1.5">
          <span className="self-start max-w-[88%] rounded-2xl rounded-bl-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-[13px] leading-snug text-slate-600 dark:text-slate-300">
            {lines[0] ?? 'Listen to your partner.'}
          </span>
          <span className="self-end max-w-[88%] rounded-2xl rounded-br-md bg-indigo-500 px-3 py-1.5 text-[13px] leading-snug text-white">
            {lines[1] ?? 'Then shadow your role.'}
          </span>
        </div>
      </div>
    );
  }

  return null;
};

const LessonCard = ({ lesson, idx: _idx, mode }: { lesson: ShadowingLesson; idx: number; mode: string }) => {
  const navigate = useNavigate();
  const prog = getLessonProgress(lesson.id);
  const cefr = levelCefr(lesson.level);
  const dur = lesson.durationMinutes ? `${lesson.durationMinutes} min` : `${lesson.totalSegments} seg`;
  const status = progressStatus(prog);

  const ctaLabel = prog >= 100 ? 'Review' : prog > 0 ? 'Continue' : 'Start';
  const ctaCls = prog >= 100
    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
    : prog > 0
      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
      : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400';
  const openLesson = () => navigate('/shadowing/practice', { state: { lesson } });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openLesson}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLesson();
        }
      }}
      className="gs-sh-card glass-card rounded-2xl overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
    >
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider', cefrClass(cefr))}>{cefr}</span>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {lesson.topic ?? (mode === 'dialogue' ? 'Roleplay' : '')}
          </span>
        </div>

        <h3 className="text-lg font-bold leading-snug mb-3">{lesson.title}</h3>

        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4 mt-auto">
          <span className="flex items-center gap-1.5">
            {mode === 'sentence' ? <Quote className="w-4 h-4" /> : mode === 'dialogue' ? <MessagesSquare className="w-4 h-4" /> : <AlignLeft className="w-4 h-4" />}
            {lesson.totalSegments} {mode === 'sentence' ? 'sentences' : mode === 'dialogue' ? 'turns' : 'segments'}
          </span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {dur}</span>
          <span className={cn('flex items-center gap-1.5 font-semibold text-xs', status.className)}>
            <status.Icon className="w-3.5 h-3.5" /> {status.label}
          </span>
        </div>

        <button
          onClick={(event) => {
            event.stopPropagation();
            openLesson();
          }}
          className={cn('w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-colors', ctaCls)}
        >
          <Play className="w-4 h-4" /> {ctaLabel} Shadowing
        </button>
      </div>
    </div>
  );
};

const FreeMode = () => (
  <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
    <div className="glass-card rounded-3xl p-7 flex flex-col">
      <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-fuchsia-500" /> Create from any text
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Paste a paragraph, script, or song lyric. Lingua reads it aloud, splits it into segments, and scores your shadowing.
      </p>
      <div className="flex-1 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-5 text-slate-400 dark:text-slate-500 text-[15px] leading-relaxed min-h-[180px]">
        Type or paste your English text here…
        <span className="inline-block w-0.5 h-5 bg-indigo-400 ml-0.5 align-middle animate-pulse" />
      </div>
      <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">
            <Upload className="w-4 h-4" /> Upload .txt
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">
            <Link className="w-4 h-4" /> From URL
          </button>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25">
          <Sparkles className="w-4 h-4" /> Generate
        </button>
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Or pick a topic</p>
        <div className="flex flex-wrap gap-2">
          {['Job interview', 'Travel', 'Movies', 'Technology', 'Food', 'Daily routine', 'Environment', 'Sports'].map((t) => (
            <span key={t} className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="glass-card rounded-2xl p-5 flex-1">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Recent free sets</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">No recent sets yet. Paste some text and generate your first set!</p>
      </div>
    </div>
  </div>
);

type VideoTab = 'voa' | 'mine';

const VideoMode = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<VideoTab>('voa');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const { voaLessons, myLessons, loading } = useVideoShadowingLibrary({
    level: 'All levels',
    category,
    search,
  });

  const categories = useMemo(() => getVoaCategories(), []);

  const voaCardData = (lesson: BuiltInVoaLesson): LessonCardData => ({
    lesson,
    grad: lesson.grad,
    category: lesson.category,
    segmentCount: lesson.segments.length,
    progress: 0,
    videoUrl: lesson.videoUrl,
  });

  const myCardData = (lesson: VideoShadowingLesson): LessonCardData => ({
    lesson,
    grad: gradForId(lesson.id),
    category: lesson.sourceType === 'DirectUrl' ? 'Video link' : 'My upload',
    segmentCount: 0,
    progress: 0,
    videoUrl: lesson.sourceUrl,
  });

  const visibleCount = tab === 'voa' ? voaLessons.length : myLessons.length;
  const listKey = `${tab}-${category}-${search.trim().toLowerCase()}`;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold">Video Shadowing</h3>
            <span className="text-[11px] font-bold tracking-widest text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 px-2 py-0.5 rounded-md uppercase">
              VOA + Upload
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Choose a VOA clip or one of your own videos, then shadow sentence by sentence.
          </p>
        </div>
        <button
          onClick={() => navigate('/video-shadowing/add')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Add Video
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          {([
            ['voa', 'VOA Library', BadgeCheck, voaLessons.length],
            ['mine', 'My Videos', Folder, myLessons.length],
          ] as const).map(([key, label, Icon, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ease-out active:scale-[0.97]',
                tab === key
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
              )}
            >
              <Icon className="w-4 h-4" /> {label}
              {count > 0 && (
                <span className="text-[10px] bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-200 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/40"
          />
        </div>
      </div>

      {tab === 'voa' && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'px-3.5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ease-out active:scale-95',
                category === c
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.03]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:-translate-y-0.5'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div key={listKey} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="aspect-video bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-9 w-full rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleCount === 0 ? (
        <div key={listKey} className="glass-card rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center py-14 px-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 text-orange-500 rounded-2xl flex items-center justify-center mb-4">
            {tab === 'mine' ? <Upload className="w-8 h-8" /> : <Clapperboard className="w-8 h-8" />}
          </div>
          <h3 className="text-xl font-bold mb-2">{tab === 'mine' ? 'No videos yet' : 'No videos found'}</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
            {tab === 'mine'
              ? 'Upload your own English video to create a shadowing lesson.'
              : 'Try another search or category.'}
          </p>
          {tab === 'mine' && (
            <button
              onClick={() => navigate('/video-shadowing/add')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/25"
            >
              <Upload className="w-4 h-4" /> Upload Video
            </button>
          )}
        </div>
      ) : (
        <div key={listKey} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-4">
          {tab === 'voa'
            ? voaLessons.map((lesson, i) => (
                <div
                  key={lesson.id}
                  className="animate-in fade-in slide-in-from-bottom-3 zoom-in-95 duration-500"
                  style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}
                >
                  <VideoLessonCard data={voaCardData(lesson)} />
                </div>
              ))
            : myLessons.map((lesson, i) => (
                <div
                  key={lesson.id}
                  className="animate-in fade-in slide-in-from-bottom-3 zoom-in-95 duration-500"
                  style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}
                >
                  <VideoLessonCard data={myCardData(lesson)} />
                </div>
              ))}
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={() => navigate('/video-shadowing')}
          className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Open full video library
        </button>
      </div>
    </div>
  );
};

const ShadowingListPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('sentence');
  const containerRef = useRef<HTMLDivElement>(null);

  const lessons: ShadowingLesson[] = ['sentence', 'paragraph', 'dialogue'].includes(mode)
    ? getLessonsByMode(mode as ShadowingMode)
    : [];

  const active = SHADOW_MODES.find(m => m.key === mode) ?? SHADOW_MODES[0];

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from('.gs-sh-header', { y: 28, autoAlpha: 0, duration: 0.55, ease: 'power3.out' });
  }, { scope: containerRef });

  useGSAP(() => {
    const cards = containerRef.current?.querySelectorAll('.gs-sh-card');
    if (!cards?.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from(cards, {
      y: 32, autoAlpha: 0, scale: 0.97,
      stagger: { amount: 0.4, from: 'start' },
      duration: 0.45, ease: 'back.out(1.4)',
    });
  }, { scope: containerRef, dependencies: [mode] });

  return (
    <div ref={containerRef} className="animate-in fade-in duration-300">
      <div className="gs-sh-header flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            Shadowing
            <span className="text-[11px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-md uppercase">
              Listen · Repeat · Score
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Choose how you want to shadow — from a single sentence to a full video.</p>
        </div>
        {mode === 'video' && (
          <button
            onClick={() => navigate('/video-shadowing/add')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" /> Add Video
          </button>
        )}
      </div>

      {/* Mode picker */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-9">
        {SHADOW_MODES.map((m) => {
          const on = m.key === mode;
          const count = ['sentence', 'paragraph', 'dialogue'].includes(m.key)
            ? `${getLessonsByMode(m.key as ShadowingMode).length} lessons`
            : m.key === 'video' ? 'VOA + upload' : 'Unlimited';
          return (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                'group text-left rounded-2xl p-4 border transition-all duration-300 ease-out relative overflow-hidden active:scale-[0.98]',
                on
                  ? 'bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-700 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30 -translate-y-0.5 scale-[1.015]'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 hover:shadow-md shadow-sm'
              )}
            >
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md mb-3 transition-transform duration-300 ease-out', on ? 'scale-110' : 'group-hover:scale-105', m.iconBg)}>
                {m.icon}
              </div>
              <p className={cn('font-bold text-[15px] mb-0.5', on ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200')}>{m.label}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-snug mb-2">{m.desc}</p>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{count}</span>
              {on && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center animate-in zoom-in duration-200">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-indigo-500">{active.icon}</span>
        <h2 className="text-xl font-bold">{active.label} Shadowing</h2>
        {lessons.length > 0 && <span className="text-sm text-slate-400 dark:text-slate-500">· {lessons.length} sets</span>}
      </div>

      {/* Content */}
      {mode === 'free' ? (
        <FreeMode />
      ) : mode === 'video' ? (
        <VideoMode />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-4">
          {lessons.map((l, i) => <LessonCard key={l.id} lesson={l} idx={i} mode={mode} />)}
        </div>
      )}
    </div>
  );
};

export default ShadowingListPage;
