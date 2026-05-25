import React from "react";
import { Mic, Square, X, RotateCcw } from "lucide-react";
import type { SpeakingSessionStatus } from "../types/speaking.types";

interface RecordingControlProps {
  status: SpeakingSessionStatus;
  durationSeconds: number;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  onRetry: () => void;
  disabledStart?: boolean;
}

export function RecordingControl({
  status,
  durationSeconds,
  onStart,
  onStop,
  onCancel,
  onRetry,
  disabledStart = false,
}: RecordingControlProps) {
  const isRecording = status === "recording" || status === "fake_transcribing";
  const isLoading = status === "requesting_permission" || status === "stopping" || status === "transcribing_with_whisper" || status === "analyzing";


  // Helper to format duration to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Timer & Status text */}
      <div className="text-center">
        <span className="text-4xl font-mono font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {formatTime(durationSeconds)}
        </span>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest mt-1">
          {isRecording
            ? "Đang thu âm..."
            : isLoading
            ? "Đang xử lý..."
            : "Bấm để bắt đầu"}
        </p>
      </div>

      {/* Main Buttons Set */}
      <div className="flex items-center justify-center gap-8">
        {/* Cancel Button */}
        <button
          onClick={onCancel}
          disabled={status === "idle" || isLoading}
          className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 dark:bg-slate-850 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          title="Hủy bỏ"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Record Button */}
        <button
          onClick={isRecording ? onStop : onStart}
          disabled={disabledStart || isLoading}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 relative shadow-xl hover:scale-105 active:scale-95 group ${
            isRecording
              ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30 scale-105"
              : disabledStart
              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed shadow-none"
              : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
          }`}
        >
          {isRecording && (
            <span className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping opacity-75 pointer-events-none" />
          )}

          {isLoading ? (
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRecording ? (
            <Square className="w-8 h-8 text-white fill-current rounded-sm" />
          ) : (
            <Mic className={`w-10 h-10 ${disabledStart ? "text-slate-400" : "text-white"}`} />
          )}
        </button>

        {/* Retry Button */}
        <button
          onClick={onRetry}
          disabled={status === "idle" || isLoading}
          className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 dark:bg-slate-850 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          title="Thu âm lại"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
export default RecordingControl;
