// Library card for a lesson (VOA or user upload). CTA adapts to progress.

import { useNavigate } from 'react-router-dom';
import { Film, Activity, Play, BarChart3, Trash2 } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { VideoThumb, cefrClass } from './primitives';
import { gradForId, type GradKey } from './videoThumbStyles';
import { formatClock } from '../utils/timestampUtils';
import type { VideoShadowingLesson } from '../models/lesson';

export interface LessonCardData {
  lesson: VideoShadowingLesson;
  grad: GradKey;
  category: string;
  segmentCount: number;
  /** 0–100 completion progress. */
  progress: number;
  /** Real clip URL — renders a poster-frame thumbnail when present. */
  videoUrl?: string;
  /** Poster image URL — preferred over the video frame when present. */
  thumbnailUrl?: string;
}

function ctaFor(progress: number) {
  if (progress >= 100) return { label: 'View Result', Icon: BarChart3, cls: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300' };
  if (progress > 0) return { label: 'Continue', Icon: Play, cls: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' };
  return { label: 'Start', Icon: Play, cls: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300' };
}

export function VideoLessonCard({
  data,
  onDelete,
}: {
  data: LessonCardData;
  onDelete?: (id: string) => void;
}) {
  const navigate = useNavigate();
  const { lesson, segmentCount, progress } = data;
  const grad = data.grad ?? gradForId(lesson.id);
  const cta = ctaFor(progress);
  const isVoa = lesson.sourceType === 'BuiltInVoa';

  const open = () => {
    if (progress >= 100) navigate(`/video-shadowing/lessons/${lesson.id}`);
    else if (isVoa) navigate(`/video-shadowing/lessons/${lesson.id}`);
    else navigate(`/video-shadowing/lessons/${lesson.id}/practice`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      }}
      className="glass-card rounded-2xl overflow-hidden flex flex-col group cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
    >
      <button
        onClick={(event) => {
          event.stopPropagation();
          open();
        }}
        className="text-left"
        aria-label={`Open ${lesson.title}`}
      >
        <VideoThumb grad={grad} source={isVoa ? 'VOA' : 'Upload'} duration={formatClock(lesson.durationMs)} progress={progress} videoUrl={data.videoUrl} thumbnailUrl={data.thumbnailUrl} />
      </button>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider', cefrClass(lesson.level))}>
            {lesson.level}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{lesson.topic}</span>
          {onDelete && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete(lesson.id);
              }}
              className="ml-auto w-7 h-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition"
              title="Delete lesson"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            open();
          }}
          className="text-left"
        >
          <h3 className="text-lg font-bold leading-snug mb-1">{lesson.title}</h3>
        </button>
        <p className="text-xs text-slate-400 font-medium mb-4">{data.category}</p>
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4 mt-auto">
          <span className="flex items-center gap-1.5">
            <Film className="w-4 h-4" /> {segmentCount} segments
          </span>
          {progress > 0 && (
            <span className="flex items-center gap-1.5 font-semibold text-indigo-500">
              <Activity className="w-4 h-4" /> {progress}%
            </span>
          )}
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            open();
          }}
          className={cn('w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition active:scale-[0.98]', cta.cls)}
        >
          <cta.Icon className="w-4 h-4" /> {cta.label}
        </button>
      </div>
    </div>
  );
}
