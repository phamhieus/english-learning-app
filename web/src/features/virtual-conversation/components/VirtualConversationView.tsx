import React, { useMemo } from "react";
import { AlertTriangle, MessageSquare } from "lucide-react";
import { cn } from "../../../components/classNames";
import { useSettings } from "../../../components/useSettings";
import { useVirtualConversation } from "../hooks/useVirtualConversation";
import { ConversationTimeline } from "./ConversationTimeline";
import { MicStatusPanel } from "./MicStatusPanel";
import { ConversationControls } from "./ConversationControls";
import type { ConversationScenario } from "../types/virtualConversation.types";

interface VirtualConversationViewProps {
  scenario: ConversationScenario;
}

const LEVEL_COLORS = {
  beginner: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  intermediate: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  advanced: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",
};

function MicPermissionError() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-rose-500" />
      </div>
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        Microphone access required
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
        Microphone permission is required to practice speaking. Please allow
        access in your browser or app settings, then try again.
      </p>
    </div>
  );
}

function ApiKeyMissing() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-amber-500" />
      </div>
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        AI provider not configured
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
        Please add your API key in Settings before starting a conversation.
      </p>
    </div>
  );
}

export function VirtualConversationView({ scenario }: VirtualConversationViewProps) {
  const settings = useSettings();

  const hasApiKey = useMemo(() => {
    if (settings.aiProvider === "gemini") return !!settings.geminiKey;
    if (settings.aiProvider === "openai") return !!settings.openAiKey;
    if (settings.aiProvider === "deepseek") return !!settings.deepseekKey;
    return false;
  }, [settings]);

  const {
    conversationState,
    turns,
    audioLevel,
    silenceCountdownMs,
    errorMessage,
    startConversation,
    stopConversation,
    retryTurn,
    cancelSending,
  } = useVirtualConversation({ scenario, settings });

  const isMicError =
    conversationState === "error" &&
    errorMessage?.toLowerCase().includes("microphone");

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-80px)] bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-50 text-base leading-tight">
              {scenario.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{scenario.description}</p>
          </div>
        </div>
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
            LEVEL_COLORS[scenario.level]
          )}
        >
          {scenario.level}
        </span>
      </div>

      {/* Body */}
      {!hasApiKey ? (
        <ApiKeyMissing />
      ) : isMicError ? (
        <MicPermissionError />
      ) : (
        <>
          {/* Chat timeline */}
          <ConversationTimeline turns={turns} />

          {/* Error banner (non-mic errors) */}
          {conversationState === "error" && errorMessage && !isMicError && (
            <div className="mx-4 mb-2 px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300 shrink-0">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Info banner for "didn't catch" */}
          {conversationState === "listening" && errorMessage && (
            <div className="mx-4 mb-2 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-sm text-amber-700 dark:text-amber-400 text-center shrink-0">
              {errorMessage}
            </div>
          )}

          {/* Mic status */}
          <div className="shrink-0 border-t border-slate-100 dark:border-slate-800">
            <MicStatusPanel
              conversationState={conversationState}
              audioLevel={audioLevel}
              silenceCountdownMs={silenceCountdownMs}
            />
          </div>

          {/* Controls */}
          <ConversationControls
            conversationState={conversationState}
            onStart={startConversation}
            onStop={stopConversation}
            onRetry={retryTurn}
            onCancelSending={cancelSending}
          />
        </>
      )}
    </div>
  );
}
