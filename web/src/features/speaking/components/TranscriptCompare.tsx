import React, { useMemo } from "react";
import { alignWords } from "../utils/transcriptDiff";

interface TranscriptCompareProps {
  targetText?: string;
  recognizedText: string;
}

export function TranscriptCompare({
  targetText,
  recognizedText,
}: TranscriptCompareProps) {
  const diffItems = useMemo(() => {
    if (!targetText) return [];
    return alignWords(targetText, recognizedText);
  }, [targetText, recognizedText]);

  if (!targetText) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl">
        <p className="text-slate-600 dark:text-slate-300 font-medium italic text-lg">
          "{recognizedText}"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Aligned Words Flow */}
      <div className="flex flex-wrap gap-x-2.5 gap-y-3.5 p-6 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100/50 dark:border-slate-800/40 leading-relaxed text-lg md:text-xl font-medium">
        {diffItems.map((item, index) => {
          switch (item.type) {
            case "correct":
              return (
                <span
                  key={index}
                  className="text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-transform cursor-help"
                  title="Correct pronunciation"
                >
                  {item.text}
                </span>
              );

            case "missing":
              return (
                <span
                  key={index}
                  className="text-rose-500 line-through decoration-2 decoration-rose-500/50 dark:text-rose-450 hover:scale-105 transition-transform cursor-help font-normal"
                  title="Word omitted when spoken"
                >
                  {item.text}
                </span>
              );

            case "substituted":
              return (
                <span
                  key={index}
                  className="inline-flex flex-col items-center bg-amber-50 dark:bg-amber-950/20 border border-amber-200/30 px-2 py-0.5 rounded-lg text-amber-700 dark:text-amber-400 text-center cursor-help hover:scale-105 transition-transform"
                  title={`Incorrect pronunciation. Expected: "${item.text}", Recognized: "${item.matchedWith}"`}
                >
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider scale-90 mb-0.5">
                    {item.matchedWith || "?"}
                  </span>
                  <span className="font-bold border-b border-dashed border-amber-400/50">
                    {item.text}
                  </span>
                </span>
              );

            case "extra":
              return (
                <span
                  key={index}
                  className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200/30 px-1.5 py-0.5 rounded text-purple-600 dark:text-purple-400 italic text-sm font-normal self-center hover:scale-105 transition-transform cursor-help"
                  title={`Extra word: spoken but not present in original sentence.`}
                >
                  +{item.text}
                </span>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Legend guide */}
      <div className="flex flex-wrap gap-4 px-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Correct Pronunciation</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Omitted Word</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Mispronounced (Recognized / Original)</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Extra Word</span>
        </div>
      </div>
    </div>
  );
}
export default TranscriptCompare;
