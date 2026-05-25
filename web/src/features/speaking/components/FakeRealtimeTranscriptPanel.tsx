import React, { useEffect, useRef } from "react";
import { Sparkles, CheckCircle2, Loader2, Info } from "lucide-react";
import type { SpeakingSessionStatus } from "../types/speaking.types";

interface FakeRealtimeTranscriptPanelProps {
  status: SpeakingSessionStatus;
  fakePreviewText: string;
  finalText?: string;
  hasTargetText: boolean;
  isFakeRunning: boolean;
}

export function FakeRealtimeTranscriptPanel({
  status,
  fakePreviewText,
  finalText,
  hasTargetText,
  isFakeRunning,
}: FakeRealtimeTranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [fakePreviewText, status]);

  const isRecording = status === "recording" || status === "fake_transcribing";
  const isTranscribing = status === "transcribing_with_whisper" || status === "analyzing";
  const isCompleted = status === "completed";

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Live Preview</h3>
        </div>
        <div>
          {isCompleted ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Whisper Final
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full">
              Browser ASR
            </span>
          )}
        </div>
      </div>

      {/* Transcript Area */}
      <div 
        ref={scrollRef}
        className="flex-1 p-5 overflow-y-auto scroll-smooth"
      >
        {status === "idle" || status === "requesting_permission" ? (
          <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 italic text-sm">
            Transcript sẽ xuất hiện khi bạn nói...
          </div>
        ) : isTranscribing ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-indigo-600 dark:text-indigo-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium animate-pulse">Đang xử lý bằng Whisper API...</p>
          </div>
        ) : isCompleted ? (
          <div className="text-lg md:text-xl font-medium leading-relaxed tracking-wide text-slate-800 dark:text-slate-100">
            {finalText || <span className="italic text-slate-400">Không nhận diện được nội dung.</span>}
          </div>
        ) : isRecording ? (
          <div className="relative min-h-[4rem]">
            {/* Live Recognized text */}
            <div className="text-lg md:text-xl font-medium leading-relaxed tracking-wide text-slate-800 dark:text-slate-200 transition-all duration-200">
              {fakePreviewText || <span className="text-slate-300 dark:text-slate-600 italic">Vui lòng nói...</span>}
              {isFakeRunning && (
                <span className="inline-block w-1.5 h-5 ml-1 align-middle bg-indigo-400 animate-pulse rounded-full" />
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer Note */}
      <div className="px-5 py-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-t border-indigo-100/50 dark:border-indigo-900/30">
        <div className="flex items-start gap-2 text-indigo-600/80 dark:text-indigo-400/80">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Live transcript được tạo bằng bộ nhận diện giọng nói của trình duyệt. Sau khi bạn dừng, hệ thống sẽ gửi bản thu âm chất lượng cao lên Whisper API để phân tích và chấm điểm chính xác.
          </p>
        </div>
      </div>
    </div>
  );
}
