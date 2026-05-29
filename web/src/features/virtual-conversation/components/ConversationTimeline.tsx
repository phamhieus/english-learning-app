import React, { useEffect, useRef } from "react";
import { Bot, User, AlertCircle } from "lucide-react";
import { cn } from "../../../components/classNames";
import type { ConversationTurn } from "../types/virtualConversation.types";

interface ConversationTimelineProps {
  turns: ConversationTurn[];
}

function TurnBubble({ turn }: { turn: ConversationTurn }) {
  const isUser = turn.role === "user";
  const hasFeedback =
    turn.feedback &&
    Object.values(turn.feedback).some((v) => v);

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow",
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-purple-500"
            : "bg-gradient-to-br from-emerald-500 to-teal-500"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={cn("flex flex-col gap-1 max-w-[75%]", isUser ? "items-end" : "items-start")}>
        {/* Main bubble */}
        <div
          className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
            isUser
              ? "bg-indigo-500 text-white rounded-tr-sm"
              : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-sm"
          )}
        >
          {turn.text}
        </div>

        {/* Corrected sentence */}
        {isUser && turn.correctedText && turn.correctedText !== turn.text && (
          <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 max-w-full">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              <span className="font-semibold">Corrected: </span>
              {turn.correctedText}
            </span>
          </div>
        )}

        {/* Feedback chips */}
        {hasFeedback && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {turn.feedback?.grammar && (
              <FeedbackChip label="Grammar" text={turn.feedback.grammar} color="rose" />
            )}
            {turn.feedback?.vocabulary && (
              <FeedbackChip label="Vocabulary" text={turn.feedback.vocabulary} color="violet" />
            )}
            {turn.feedback?.fluency && (
              <FeedbackChip label="Fluency" text={turn.feedback.fluency} color="sky" />
            )}
            {turn.feedback?.suggestion && (
              <FeedbackChip label="Tip" text={turn.feedback.suggestion} color="emerald" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type ChipColor = "rose" | "violet" | "sky" | "emerald";
const chipColors: Record<ChipColor, string> = {
  rose: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50",
  violet: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/50",
  sky: "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50",
  emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
};

function FeedbackChip({ label, text, color }: { label: string; text: string; color: ChipColor }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium",
        chipColors[color]
      )}
      title={text}
    >
      <span className="font-semibold">{label}:</span>
      <span className="max-w-[160px] truncate">{text}</span>
    </span>
  );
}

export function ConversationTimeline({ turns }: ConversationTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length]);

  if (turns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
        Conversation will appear here...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {turns.map((turn) => (
        <TurnBubble key={turn.id} turn={turn} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
