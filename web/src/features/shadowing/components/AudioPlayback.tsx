import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../../components/classNames';

interface AudioPlaybackProps {
  src: string;
  title?: string;
  durationMs?: number;
  compact?: boolean;
  className?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const AudioPlayback: React.FC<AudioPlaybackProps> = ({
  src,
  title,
  durationMs,
  compact = false,
  className,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationMs ? durationMs / 1000 : 0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasError(false);
    setDuration(durationMs ? durationMs / 1000 : 0);
  }, [src, durationMs]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || hasError) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current?.currentTime ?? 0);
  };

  const handleLoadedMetadata = () => {
    const d = audioRef.current?.duration;
    if (d && isFinite(d)) setDuration(d);
    setIsLoading(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const handleError = () => {
    setHasError(true);
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={handleError}
          preload="metadata"
        />
        <button
          onClick={togglePlay}
          disabled={hasError}
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors',
            hasError
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800/50'
          )}
        >
          {isLoading ? (
            <div className="w-3 h-3 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : hasError ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            disabled={hasError || duration === 0}
            className="w-full h-1 accent-indigo-500 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono shrink-0 tabular-nums">
          {formatTime(currentTime)}
          {duration > 0 && ` / ${formatTime(duration)}`}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'glass-card rounded-2xl px-4 py-3 flex flex-col gap-2',
        className
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
      />

      {title && (
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{title}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={hasError}
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all',
            hasError
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/30 hover:scale-105 active:scale-95'
          )}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : hasError ? (
            <VolumeX className="w-4 h-4" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div
            className="relative h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden cursor-pointer"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const t = ratio * (duration || 0);
              setCurrentTime(t);
              if (audioRef.current) audioRef.current.currentTime = t;
            }}
          >
            <div
              className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-slate-400 font-mono tabular-nums">
              {formatTime(currentTime)}
            </span>
            {duration > 0 && (
              <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                {formatTime(duration)}
              </span>
            )}
          </div>
        </div>
      </div>

      {hasError && (
        <p className="text-[11px] text-red-400 text-center">
          Audio unavailable
        </p>
      )}
    </div>
  );
};
