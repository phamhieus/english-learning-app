import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Plus, BadgeCheck, Folder, Upload, Clapperboard, Sparkles } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { useToast } from '../../../components/useToast';
import { useVideoShadowingLibrary } from '../hooks/useVideoShadowingLibrary';
import { VideoLessonCard, type LessonCardData } from '../components/VideoLessonCard';
import { getVoaCategories, type BuiltInVoaLesson } from '../services/video-source/builtInVoaResolver';
import { gradForId } from '../components/videoThumbStyles';
import type { VideoShadowingLesson } from '../models/lesson';

type Tab = 'voa' | 'mine';
const LEVELS = ['All levels', 'A1', 'A2', 'B1', 'B2'];

export default function VideoShadowingLibraryPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('voa');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [level, setLevel] = useState('All levels');
  const [category, setCategory] = useState('All');

  // Debounce the search box before it hits the API.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Each filter change → API call returns the matching videos.
  const { voaLessons, myLessons, loading, removeLesson } = useVideoShadowingLibrary({
    level,
    category,
    search: debouncedSearch,
  });

  const categories = useMemo(() => getVoaCategories(), []);

  const voaCardData = (l: BuiltInVoaLesson): LessonCardData => ({
    lesson: l,
    grad: l.grad,
    category: l.category,
    segmentCount: l.segments.length,
    progress: 0,
    videoUrl: l.videoUrl,
  });

  const myCardData = (l: VideoShadowingLesson): LessonCardData => ({
    lesson: l,
    grad: gradForId(l.id),
    category: l.sourceType === 'DirectUrl' ? 'Video link' : 'My upload',
    segmentCount: 0,
    progress: 0,
    videoUrl: l.sourceUrl,
  });

  const handleDelete = async (id: string) => {
    await removeLesson(id);
    toast.success('Đã xóa bài và dọn dẹp file cục bộ.');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
            Video Shadowing
            <span className="text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 rounded-md uppercase">
              Beta
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Nghe — nhại theo — chấm điểm. Luyện phát âm theo video thật.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos…"
              className="w-full sm:w-56 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/40"
            />
          </div>
          <button className="h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4" /> <span className="hidden sm:inline">Level</span>
          </button>
          <button
            onClick={() => navigate('/video-shadowing/add')}
            className="h-10 px-4 bg-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition shrink-0"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Tabs + level filter */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          {([['voa', 'VOA Library', BadgeCheck], ['mine', 'My Videos', Folder]] as const).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition',
                tab === k ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
              )}
            >
              <Icon className="w-4 h-4" /> {label}
              {k === 'mine' && myLessons.length > 0 && (
                <span className="text-[10px] bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-200 px-1.5 py-0.5 rounded-full">{myLessons.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((f) => (
            <button
              key={f}
              onClick={() => setLevel(f)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition',
                level === f ? 'bg-slate-900 dark:bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips (VOA only) */}
      {tab === 'voa' && (
        <div className="flex flex-wrap gap-2 mb-7">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'px-3.5 py-2 rounded-full text-[13px] font-medium transition',
                category === c ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Grid / loading / empty state */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-slate-100 dark:bg-slate-800" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-9 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'mine' ? (
        myLessons.length === 0 ? (
          <MyVideosEmptyState onAdd={() => navigate('/video-shadowing/add')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {myLessons.map((l) => (
              <VideoLessonCard key={l.id} data={myCardData(l)} onDelete={handleDelete} />
            ))}
          </div>
        )
      ) : voaLessons.length === 0 ? (
        <div className="glass-card rounded-3xl py-16 text-center text-slate-500 dark:text-slate-400">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-indigo-400" />
          Không tìm thấy video phù hợp bộ lọc.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {voaLessons.map((l) => (
            <VideoLessonCard key={l.id} data={voaCardData(l)} />
          ))}
        </div>
      )}
    </div>
  );
}

function MyVideosEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="glass-card rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center py-20 px-8 mt-2">
      <div className="relative mb-7">
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center">
          <Clapperboard className="w-14 h-14 text-indigo-500/90" />
        </div>
        <div className="absolute -right-3 -bottom-3 w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 rotate-6">
          <Upload className="w-6 h-6" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-2">No videos yet</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-7 leading-relaxed">
        Upload your own English video to create a shadowing lesson — Lingua sẽ tự tách script và chia câu để bạn luyện.
      </p>
      <button onClick={onAdd} className="h-12 px-6 bg-indigo-600 text-white rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition">
        <Upload className="w-5 h-5" /> Upload Video
      </button>
      <p className="text-xs text-slate-400 mt-4">MP4, MOV, WebM · tối đa 300MB · phụ đề .srt/.vtt là tùy chọn</p>
    </div>
  );
}
