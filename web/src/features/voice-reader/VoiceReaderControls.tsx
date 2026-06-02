import type { ReactNode } from 'react';
import { Pause, Play, RotateCcw, Square, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../components/classNames';
import type { VoiceReaderStatus } from './useVoiceReader';

interface VoiceReaderToggleProps {
  supported: boolean;
  globallyEnabled: boolean;
  muted: boolean;
  onChange: (muted: boolean) => void;
}

export function VoiceReaderToggle({
  supported,
  globallyEnabled,
  muted,
  onChange,
}: VoiceReaderToggleProps) {
  if (!supported) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700">
        <VolumeX className="w-3.5 h-3.5" /> Voice Reader is not supported on this device.
      </span>
    );
  }

  if (!globallyEnabled) return <VoiceReaderDisabledNote />;

  const on = !muted;
  return (
    <button
      type="button"
      onClick={() => onChange(on)}
      className={cn(
        'inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full text-xs font-bold border transition-colors select-none',
        on
          ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
      )}
    >
      <span className={cn('flex items-center justify-center w-5 h-5 rounded-full', on ? 'bg-indigo-500 text-white' : 'bg-slate-300 text-white')}>
        {on ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
      </span>
      Voice Reader: {on ? 'On' : 'Off'}
    </button>
  );
}

export function VoiceReaderDisabledNote() {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700">
      <VolumeX className="w-3.5 h-3.5" /> Voice Reader is disabled in Settings.
    </span>
  );
}

interface VoiceReaderControlsProps extends VoiceReaderToggleProps {
  status: VoiceReaderStatus;
  canPlay: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onReplay: () => void;
  onStop: () => void;
  className?: string;
}

export function VoiceReaderControls({
  supported,
  globallyEnabled,
  muted,
  onChange,
  status,
  canPlay,
  onPlay,
  onPause,
  onResume,
  onReplay,
  onStop,
  className,
}: VoiceReaderControlsProps) {
  const disabled = !canPlay;
  const isPlaying = status === 'playing' || status === 'loading';
  const isPaused = status === 'paused';

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <ReaderButton disabled={disabled || isPlaying} onClick={isPaused ? onResume : onPlay}>
        <Play className="w-3.5 h-3.5" /> {isPaused ? 'Resume' : 'Play'}
      </ReaderButton>
      <ReaderButton disabled={disabled || !isPlaying} onClick={onPause}>
        <Pause className="w-3.5 h-3.5" /> Pause
      </ReaderButton>
      <ReaderButton disabled={disabled} onClick={onReplay}>
        <RotateCcw className="w-3.5 h-3.5" /> Replay
      </ReaderButton>
      <ReaderButton disabled={!isPlaying && !isPaused} onClick={onStop}>
        <Square className="w-3.5 h-3.5" /> Stop
      </ReaderButton>
      <VoiceReaderToggle
        supported={supported}
        globallyEnabled={globallyEnabled}
        muted={muted}
        onChange={onChange}
      />
    </div>
  );
}

function ReaderButton({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
