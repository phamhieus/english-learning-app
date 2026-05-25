import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type {
  SpeakingPrompt,
} from "../types/speaking.types";
import { useSpeakingSession } from "../hooks/useSpeakingSession";
import { useSpeakingAnalysis } from "../hooks/useSpeakingAnalysis";
import { RecordingControl } from "./RecordingControl";
import { AudioWaveform } from "./AudioWaveform";
import { FakeRealtimeTranscriptPanel } from "./FakeRealtimeTranscriptPanel";
import { Volume2, VolumeX, ArrowLeft } from "lucide-react";
import { useToast } from "../../../components/ToastContext";

interface SpeakingPracticeViewProps {
  practice: SpeakingPrompt;
}

export function SpeakingPracticeView({ practice }: SpeakingPracticeViewProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { saveToHistory } = useSpeakingAnalysis();

  const [isPlayingTts, setIsPlayingTts] = useState(false);

  const {
    status,
    error,
    fakeTranscript,
    finalResult,
    durationSeconds,
    mediaStream,
    isRecording,
    isFakeRunning,
    start,
    stop,
    cancel,
    retry,
  } = useSpeakingSession(practice, "en");

  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (status === "idle" || status === "recording") {
      hasCompletedRef.current = false;
    }
  }, [status]);

  // Auto-redirect or handle finished state
  useEffect(() => {
    if (status === "completed" && finalResult && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      // Save history log
      saveToHistory(
        { title: practice.title, type: practice.type || "Speaking Practice" },
        finalResult
      );
      toast.success("Đánh giá hoàn tất!");
      
      // Navigate to SpeakingResult screen
      navigate("/speaking/result", {
        state: {
          result: finalResult,
          recognizedText: finalResult.transcript.text,
          transcript: practice.targetText || "",
          practice,
        },
      });
    }
  }, [status, finalResult, practice, navigate, saveToHistory, toast]);

  // Audio prompt TTS player
  const handlePlayTts = () => {
    if (isPlayingTts) {
      window.speechSynthesis.cancel();
      setIsPlayingTts(false);
      return;
    }

    if (!practice.targetText) return;

    const utterance = new SpeechSynthesisUtterance(practice.targetText);
    utterance.lang = "en-US";
    utterance.onend = () => setIsPlayingTts(false);
    utterance.onerror = () => setIsPlayingTts(false);
    
    setIsPlayingTts(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            cancel();
            navigate(-1);
          }}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <span className="px-3.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-750 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/50 rounded-full capitalize">
          {practice.mode.replace("_", " ")}
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Prompt Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col h-full min-h-[300px]">
            {/* Header prompt details */}
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Câu Hỏi / Đề Bài
              </span>
              {practice.targetText && (
                <button
                  onClick={handlePlayTts}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isPlayingTts
                      ? "bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-450 scale-105"
                      : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 hover:scale-105"
                  }`}
                  title="Nghe mẫu phát âm"
                >
                  {isPlayingTts ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-850 dark:text-slate-100 mb-3">
              {practice.title}
            </h2>

            {/* Target speech display */}
            <div className="flex-1 mt-4">
              {practice.targetText ? (
                <p className="text-lg md:text-xl font-medium text-slate-850 dark:text-slate-200 leading-relaxed bg-slate-50/50 dark:bg-slate-950/10 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-900/30">
                  {practice.targetText}
                </p>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 italic text-sm">
                  {practice.question || "Hãy bấm thu âm và tự do trả lời theo cách của bạn."}
                </p>
              )}
            </div>

            {/* Instruction tips */}
            {practice.tips && practice.tips.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800/60">
                <span className="text-[11px] font-bold text-indigo-550 dark:text-indigo-400 uppercase tracking-wider block mb-2">
                  Tips phát âm
                </span>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                  {practice.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel: Recorder UI */}
        <div className="lg:col-span-1 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm min-h-[400px]">
          <div className="space-y-6 flex-1 flex flex-col justify-center">
            
            {/* Visual Waveform */}
            <AudioWaveform
              isRecording={isRecording}
              mediaStream={mediaStream}
            />

            {/* Recorder Controls */}
            <RecordingControl
              status={status}
              durationSeconds={durationSeconds}
              onStart={start}
              onStop={stop}
              onCancel={cancel}
              onRetry={retry}
              disabledStart={false}
            />
          </div>
        </div>

        {/* Right Panel: Fake Live Transcript panel */}
        <div className="lg:col-span-1 h-full min-h-[400px]">
          <FakeRealtimeTranscriptPanel
            status={status}
            fakePreviewText={fakeTranscript}
            finalText={finalResult?.transcript.text}
            hasTargetText={!!practice.targetText}
            isFakeRunning={isFakeRunning}
          />
        </div>
      </div>
    </div>
  );
}

export default SpeakingPracticeView;
