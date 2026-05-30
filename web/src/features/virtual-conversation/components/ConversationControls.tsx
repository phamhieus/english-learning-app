import React from "react";
import { Play, Square, RotateCcw, X } from "lucide-react";
import { cn } from "../../../components/classNames";
import type { ConversationState } from "../types/virtualConversation.types";

interface ConversationControlsProps {
  conversationState: ConversationState;
  onStart: () => void;
  onStop: () => void;
  onRetry: () => void;
  onCancelSending: () => void;
}

export function ConversationControls({
  conversationState,
  onStart,
  onStop,
  onRetry,
  onCancelSending,
}: ConversationControlsProps) {
  const isIdle = conversationState === "idle";
  const isStopped = conversationState === "stopped";
  const isError = conversationState === "error";
  const isActive =
    conversationState !== "idle" &&
    conversationState !== "stopped" &&
    conversationState !== "error";
  const isSilenceCounting = conversationState === "silenceCounting";

  return (
    <div className="flex items-center justify-center gap-3 py-4 border-t border-slate-100 dark:border-slate-800 px-4">
      {(isIdle || isStopped) && (
        <button
          onClick={onStart}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-md",
            "bg-gradient-to-r from-indigo-500 to-purple-500 text-white",
            "hover:from-indigo-600 hover:to-purple-600 hover:shadow-indigo-500/30 hover:scale-[1.03] active:scale-95"
          )}
        >
          <Play className="w-4 h-4" />
          {isStopped ? "Restart" : "Start Conversation"}
        </button>
      )}

      {isActive && (
        <button
          onClick={onStop}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200",
            "bg-rose-500 text-white hover:bg-rose-600 hover:scale-[1.03] active:scale-95 shadow-md shadow-rose-500/20"
          )}
        >
          <Square className="w-4 h-4" />
          Stop
        </button>
      )}

      {isSilenceCounting && (
        <button
          onClick={onCancelSending}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200",
            "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
            "hover:bg-amber-200 dark:hover:bg-amber-900/50 active:scale-95"
          )}
        >
          <X className="w-4 h-4" />
          Cancel Send
        </button>
      )}

      {(isActive || isError) && (
        <button
          onClick={onRetry}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200",
            "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
            "hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
          )}
        >
          <RotateCcw className="w-4 h-4" />
          Retry Turn
        </button>
      )}
    </div>
  );
}
