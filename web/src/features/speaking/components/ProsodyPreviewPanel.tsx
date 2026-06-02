import React from "react";
import type { ProsodyResult } from "../types/speaking.types";
import { Clock, Info } from "lucide-react";

interface ProsodyPreviewPanelProps {
  prosody?: ProsodyResult;
}

export function ProsodyPreviewPanel({ prosody }: ProsodyPreviewPanelProps) {
  if (!prosody) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Rhythm & Pitch Analysis
        </h3>
        {prosody.isPlaceholder && (
          <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Info className="w-3 h-3" />
            Basic Evaluation
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100/30 dark:border-slate-800/30">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">
            Recording Duration
          </span>
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1 block">
            {prosody.totalDurationSeconds.toFixed(1)}s
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100/30 dark:border-slate-800/30">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">
            Average Speed
          </span>
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1 block">
            {prosody.speakingRateWpm || 0} WPM
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100/30 dark:border-slate-800/30">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">
            Ending Intonation
          </span>
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1 block capitalize">
            {prosody.finalTone === "falling"
              ? "Falling"
              : prosody.finalTone === "rising"
              ? "Rising"
              : "Flat"}
          </span>
        </div>
      </div>

      <div className="px-5 py-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl">
        <div className="flex items-start gap-2 text-indigo-600/80 dark:text-indigo-400/80">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Intonation and stress are currently assessed at a basic level. Deeper analysis using a prosody analyzer can be integrated later.
          </p>
        </div>
      </div>
    </div>
  );
}
