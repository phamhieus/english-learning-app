import React from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "../../../components/classNames";
import type { ConversationState } from "../types/virtualConversation.types";

interface MicStatusPanelProps {
  conversationState: ConversationState;
  audioLevel: number;
  silenceCountdownMs: number;
}

function StatusLabel({ state }: { state: ConversationState }) {
  const labels: Record<ConversationState, string> = {
    idle: "Press Start to begin",
    listening: "Listening...",
    speaking: "Speaking...",
    silenceCounting: "Silence detected...",
    stopping: "Processing...",
    uploading: "Uploading audio...",
    aiThinking: "AI is thinking...",
    aiSpeaking: "AI is speaking...",
    stopped: "Conversation ended",
    error: "Error occurred",
  };
  return <span>{labels[state]}</span>;
}

export function MicStatusPanel({
  conversationState,
  audioLevel,
  silenceCountdownMs,
}: MicStatusPanelProps) {
  const isActive = conversationState === "listening" || conversationState === "speaking" || conversationState === "silenceCounting";
  const isBusy = conversationState === "uploading" || conversationState === "aiThinking" || conversationState === "stopping";
  const isSilenceCounting = conversationState === "silenceCounting";
  const silenceProgressPct = isSilenceCounting
    ? Math.max(0, (silenceCountdownMs / 3000) * 100)
    : 0;

  // Scale audio level bar (rms is roughly 0–0.3 in practice).
  const barWidth = Math.min(100, (audioLevel / 0.25) * 100);

  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4">
      {/* Mic icon with animated ring */}
      <div className="relative flex items-center justify-center">
        {isActive && (
          <span
            className="absolute inset-0 rounded-full animate-ping bg-indigo-400/30"
            style={{ animationDuration: "1.2s" }}
          />
        )}
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
            isActive
              ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
              : isBusy
              ? "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
          )}
        >
          {isBusy ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : isActive ? (
            <Mic className="w-7 h-7" />
          ) : (
            <MicOff className="w-7 h-7" />
          )}
        </div>
      </div>

      {/* Status text */}
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
        <StatusLabel state={conversationState} />
      </p>

      {/* Audio level bar */}
      {isActive && (
        <div className="w-full max-w-[200px] h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-75"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      )}

      {/* Silence countdown */}
      {isSilenceCounting && (
        <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Sending in {(silenceCountdownMs / 1000).toFixed(1)}s...
          </p>
          <div className="w-full h-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-100"
              style={{ width: `${100 - silenceProgressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
