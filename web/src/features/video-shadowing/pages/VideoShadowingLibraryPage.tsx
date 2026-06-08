import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, BadgeCheck, Folder, Upload, Clapperboard, Sparkles, Loader2, Play } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { useToast } from '../../../components/useToast';
import { useVideoShadowingLibrary } from '../hooks/useVideoShadowingLibrary';
import { VideoLessonCard, type LessonCardData } from '../components/VideoLessonCard';
import { VideoThumb } from '../components/primitives';
import { searchArchiveItems, type ArchiveLibraryItem } from '../services/video-source/archiveLiveApi';
import { prepareArchiveLesson, ArchiveProxyError } from '../services/video-source/archiveProxyApi';
import { gradForId } from '../components/videoThumbStyles';
import type { VideoShadowingLesson } from '../models/lesson';

type Tab = 'voa' | 'mine';
const LEVELS = ['All levels', 'A1', 'A2', 'B1', 'B2', 'C1'];

export default function VideoShadowingLibraryPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>('voa');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [level, setLevel] = useState('All levels');

  // Live Internet Archive results — 30 on entry, refreshed on every search.
  const [items, setItems] = useState<ArchiveLibraryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(false);

  // Debounce the search box before it hits the Archive API.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Query archive.org directly — advancedsearch is CORS-enabled, no backend.
  useEffect(() => {
    const ac = new AbortController();
    setItemsLoading(true);
    setItemsError(false);
    searchArchiveItems(debouncedSearch, 30, ac.signal)
      .then((res) => setItems(res))
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setItemsError(true);
        setItems([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setItemsLoading(false);
      });
    return () => ac.abort();
  }, [debouncedSearch]);

  // "My Videos" still comes from local storage.
  const { myLessons, removeLesson } = useVideoShadowingLibrary({ level, category: 'All', search: debouncedSearch });

  const myCardData = (l: VideoShadowingLesson): LessonCardData => ({
    lesson: l,
    grad: gradForId(l.id),
    category: l.sourceType === 'DirectUrl' ? 'Video link' : 'My upload',
    segmentCount: 0,
    progress: 0,
    videoUrl: l.sourceUrl,
  });

  // Opening a live item: the Archive helper service fetches + parses its captions
  // into segments (the one CORS-blocked step), we persist it locally, then jump
  // straight into the practice screen — full per-segment shadowing.
  const [preparingId, setPreparingId] = useState<string | null>(null);
  const openItem = async (item: ArchiveLibraryItem) => {
    if (preparingId) return;
    setPreparingId(item.identifier);
    try {
      const { lessonId } = await prepareArchiveLesson(item.identifier);
      navigate(`/video-shadowing/lessons/${lessonId}/practice`);
    } catch (err) {
      toast.error(err instanceof ArchiveProxyError ? err.message : 'Could not load this video.');
      setPreparingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    await removeLesson(id);
    toast.success('Lesson deleted and local files cleaned up.');
  };

  // Filter the live list by the auto-estimated CEFR level.
  const filteredItems = level === 'All levels' ? items : items.filter((i) => i.level === level);

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
          <p className="text-slate-500 dark:text-slate-400">Listen — shadow — get scored. Practice pronunciation with real-world videos.</p>
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
          {([['voa', 'Library', BadgeCheck], ['mine', 'My Videos', Folder]] as const).map(([k, label, Icon]) => (
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
        {/* Level filter — live items are auto-classified (CEFR) from their text;
            My Videos use the lesson's own level. */}
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

      {/* Grid / loading / empty state */}
      {tab === 'mine' ? (
        myLessons.length === 0 ? (
          <MyVideosEmptyState onAdd={() => navigate('/video-shadowing/add')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {myLessons.map((l) => (
              <VideoLessonCard key={l.id} data={myCardData(l)} onDelete={handleDelete} />
            ))}
          </div>
        )
      ) : itemsLoading ? (
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
      ) : itemsError ? (
        <div className="glass-card rounded-3xl py-16 text-center text-slate-500 dark:text-slate-400">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-indigo-400" />
          Couldn’t reach the Internet Archive. Check your connection and try again.
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-card rounded-3xl py-16 text-center text-slate-500 dark:text-slate-400">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-indigo-400" />
          {level === 'All levels' ? 'No videos found. Try a different search.' : `No ${level} videos in these results. Try another level or search.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {filteredItems.map((item) => (
            <ArchiveCard
              key={item.identifier}
              item={item}
              preparing={preparingId === item.identifier}
              disabled={preparingId !== null && preparingId !== item.identifier}
              onOpen={() => openItem(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArchiveCard({
  item,
  preparing,
  disabled,
  onOpen,
}: {
  item: ArchiveLibraryItem;
  preparing: boolean;
  disabled: boolean;
  onOpen: () => void;
}) {
  const open = () => {
    if (!disabled && !preparing) onOpen();
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className={cn(
        'glass-card rounded-2xl overflow-hidden flex flex-col group transition-all duration-300',
        disabled ? 'opacity-50' : 'cursor-pointer hover:-translate-y-1 hover:shadow-xl',
      )}
    >
      <VideoThumb grad={gradForId(item.identifier)} source="VOA" duration={item.runtime} thumbnailUrl={item.thumbnailUrl} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          {item.level !== 'Auto' && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              {item.level}
            </span>
          )}
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Internet Archive</span>
        </div>
        <h3 className="text-lg font-bold leading-snug mb-1 line-clamp-2">{item.title}</h3>
        {item.topic && <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-1 capitalize">{item.topic}</p>}
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          disabled={preparing || disabled}
          className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white shadow-md shadow-indigo-500/25 transition active:scale-[0.98] disabled:opacity-60"
        >
          {preparing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Preparing…
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Start shadowing
            </>
          )}
        </button>
      </div>
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
        Upload your own English video to create a shadowing lesson — Lingua will automatically transcribe and segment the audio for you to practice.
      </p>
      <button onClick={onAdd} className="h-12 px-6 bg-indigo-600 text-white rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition">
        <Upload className="w-5 h-5" /> Upload Video
      </button>
      <p className="text-xs text-slate-400 mt-4">MP4, MOV, WebM · up to 300MB · .srt/.vtt subtitles are optional</p>
    </div>
  );
}
