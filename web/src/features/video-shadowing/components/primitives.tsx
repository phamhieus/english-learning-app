// Small shared UI primitives for the Video Shadowing module, ported from the
// design prototype to the real app's Tailwind `dark:` convention + lucide-react.
/* eslint-disable react-refresh/only-export-components */

import { BadgeCheck, Upload, Clock, Play, Check } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { GRADS, type GradKey } from './videoThumbStyles';
import type { LessonLevel } from '../models/lesson';

// CEFR level pill colours — green→blue→orange→violet ladder.
export function cefrClass(level: LessonLevel | string): string {
  const map: Record<string, string> = {
    A1: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
    A2: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    B1: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
    B2: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  };
  return map[level] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
}

export function SourceBadge({ source }: { source: 'VOA' | 'Upload' }) {
  const voa = source === 'VOA';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-md shadow-sm',
        voa ? 'bg-white/90 text-indigo-600 dark:bg-slate-800/90 dark:text-indigo-300' : 'bg-purple-600/90 text-white',
      )}
    >
      {voa ? <BadgeCheck className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
      {voa ? 'VOA Learning English' : 'My Upload'}
    </span>
  );
}

interface VideoThumbProps {
  grad?: GradKey;
  source?: 'VOA' | 'Upload';
  duration?: string;
  progress?: number;
  rounded?: string;
  big?: boolean;
  /** When set, a real poster frame from the actual clip is shown. */
  videoUrl?: string;
}

/** Video thumbnail: a real poster frame when `videoUrl` is given, otherwise a
 *  gradient placeholder. Always shows the frosted play button + source badge. */
export function VideoThumb({
  grad = 'indigo',
  source = 'VOA',
  duration,
  progress = 0,
  rounded = 'rounded-t-2xl',
  big = false,
  videoUrl,
}: VideoThumbProps) {
  return (
    <div className={cn('relative overflow-hidden aspect-video', rounded)} style={{ background: GRADS[grad] }}>
      {videoUrl ? (
        <>
          {/* `#t=` shows the frame at ~1s as a static poster (metadata only). */}
          <video
            src={`${videoUrl}#t=1`}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            tabIndex={-1}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0 opacity-25"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.18) 0 2px,transparent 2px 26px)' }}
          />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 42%,rgba(255,255,255,0.22),transparent 60%)' }} />
        </>
      )}
      <div className="absolute top-3 left-3 z-10">
        <SourceBadge source={source} />
      </div>
      {duration && (
        <span className="absolute bottom-3 right-3 z-10 px-2 py-0.5 rounded-md bg-black/55 text-white text-[11px] font-semibold font-mono backdrop-blur-sm flex items-center gap-1">
          <Clock className="w-3 h-3" /> {duration}
        </span>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            'rounded-full bg-white/25 backdrop-blur-md border border-white/50 flex items-center justify-center shadow-lg',
            big ? 'w-20 h-20' : 'w-14 h-14',
          )}
        >
          <Play className={cn('text-white', big ? 'w-9 h-9' : 'w-6 h-6')} style={{ marginLeft: big ? 5 : 3, fill: 'currentColor' }} />
        </div>
      </div>
      {progress > 0 && progress < 100 && (
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/25">
          <div className="h-full bg-white" style={{ width: `${progress}%` }} />
        </div>
      )}
      {progress >= 100 && (
        <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md">
          <Check className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

interface WaveformProps {
  heights: number[];
  color?: string;
  barWidth?: string;
  gap?: string;
}

export function Waveform({ heights, color = 'bg-indigo-500', barWidth = 'w-1', gap = 'gap-1' }: WaveformProps) {
  return (
    <div className={cn('flex items-center', gap)}>
      {heights.map((h, i) => (
        <div key={i} className={cn(barWidth, color, 'rounded-full')} style={{ height: `${h}px` }} />
      ))}
    </div>
  );
}

export const WAVE = [6, 12, 22, 14, 28, 18, 34, 20, 30, 12, 24, 16, 8, 18, 26, 14, 22, 10];

/** Thin labelled progress bar used in quick feedback. */
export function ScorePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="relative w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className={cn('absolute inset-y-0 left-0 rounded-full', color)} style={{ width: `${value}%` }} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold">{value}</span>
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
    </div>
  );
}

/** Circular score ring (Result screen). */
export function ScoreRing({
  score,
  label,
  colorClass,
  size = 132,
}: {
  score: number;
  label?: string;
  colorClass: string;
  size?: number;
}) {
  const sw = size > 100 ? 11 : 8;
  const r = (size - sw) / 2;
  const c = r * 2 * Math.PI;
  const off = c - (score / 100) * c;
  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" style={{ overflow: 'visible' }}>
        <circle cx={size / 2} cy={size / 2} r={r} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={sw} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={colorClass}
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ inset: 0 }}>
        <span className={cn('font-bold', size > 100 ? 'text-3xl' : 'text-xl')}>{score}</span>
      </div>
      {label && <span className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</span>}
    </div>
  );
}
