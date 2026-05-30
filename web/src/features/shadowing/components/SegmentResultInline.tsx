import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Mic,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { cn } from '../../../components/classNames';
import type { ShadowingAttempt } from '../types/shadowing.types';
import { AudioPlayback } from './AudioPlayback';
import { WordHighlight, WordLegend } from './WordHighlight';

interface ScoreBarProps {
  label: string;
  value: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, value }) => {
  const color =
    value >= 80
      ? 'bg-green-500'
      : value >= 65
        ? 'bg-amber-500'
        : 'bg-red-400';

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs text-slate-500 dark:text-slate-400 w-28 shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-7 text-right shrink-0 text-slate-700 dark:text-slate-300">
        {value}
      </span>
    </div>
  );
};

interface SegmentResultInlineProps {
  attempt: ShadowingAttempt;
  onRecordAgain: () => void;
  defaultExpanded?: boolean;
}

export const SegmentResultInline: React.FC<SegmentResultInlineProps> = ({
  attempt,
  onRecordAgain,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const scoreColor =
    attempt.finalScore >= 80
      ? 'text-green-600 dark:text-green-400'
      : attempt.finalScore >= 65
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-500 dark:text-red-400';

  const scoreBg =
    attempt.finalScore >= 80
      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      : attempt.finalScore >= 65
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden mt-3">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'text-sm font-bold tabular-nums px-2.5 py-0.5 rounded-full border',
              scoreBg,
              scoreColor
            )}
          >
            {attempt.finalScore}
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Your Result
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-[200px]">
            "{attempt.recognizedText.slice(0, 50)}
            {attempt.recognizedText.length > 50 ? '…' : ''}"
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            onClick={e => {
              e.stopPropagation();
              onRecordAgain();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Record Again</span>
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-4 space-y-5 bg-white dark:bg-slate-900/30">
          {/* Transcripts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Original
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {attempt.originalText}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                You Said
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 italic leading-relaxed">
                {attempt.recognizedText || (
                  <span className="text-slate-300 dark:text-slate-600">
                    (no speech detected)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Word Highlight */}
          {attempt.wordResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Word Analysis
              </p>
              <WordHighlight words={attempt.wordResults} />
              <WordLegend />
            </div>
          )}

          {/* Audio Players */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                <Mic className="w-3 h-3" />
                Your Recording
              </p>
              <AudioPlayback
                src={attempt.userAudioUrl}
                durationMs={attempt.audioDurationMs}
                compact
              />
            </div>

            {attempt.originalAudioUrl && (
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  <Volume2 className="w-3 h-3" />
                  Original Audio
                </p>
                <AudioPlayback
                  src={attempt.originalAudioUrl}
                  compact
                />
              </div>
            )}
          </div>

          {/* Score Breakdown */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Score Breakdown
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ScoreBar label="Pronunciation" value={attempt.pronunciationScore} />
              <ScoreBar label="Completeness" value={attempt.completenessScore} />
              <ScoreBar label="Fluency" value={attempt.fluencyScore} />
              <ScoreBar label="Rhythm" value={attempt.rhythmScore} />
              <ScoreBar label="Intonation" value={attempt.intonationScore} />
            </div>
          </div>

          {/* AI Feedback */}
          <div className="flex gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900">
            <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
              {attempt.feedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
