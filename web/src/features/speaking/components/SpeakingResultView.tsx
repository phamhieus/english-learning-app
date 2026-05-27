import React from "react";
import { useNavigate } from "react-router-dom";
import type { ProsodyResult, SpeakingAnalysisResult, SpeakingIssue, SpeakingPrompt } from "../types/speaking.types";
import { SpeakingScoreCards } from "./SpeakingScoreCards";
import { TranscriptCompare } from "./TranscriptCompare";
import { ProsodyPreviewPanel } from "./ProsodyPreviewPanel";
import { RotateCcw, ArrowRight, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";

interface SpeakingResultViewProps {
  result: SpeakingResultData;
  practice: SpeakingPrompt;
  recognizedText: string;
  transcript: string;
}

type SpeakingResultData = Omit<Partial<SpeakingAnalysisResult>, "feedback"> & {
  score?: number;
  feedback?: string | string[];
  improvementTips?: string[];
  issues?: SpeakingIssue[];
  prosody?: ProsodyResult;
};

export function SpeakingResultView({
  result,
  practice,
  recognizedText,
  transcript,
}: SpeakingResultViewProps) {
  const navigate = useNavigate();

  // Normalize scores and values between SpeakingFeedback and SpeakingAnalysisResult
  const overall = result.overallScore ?? result.score ?? 0;
  const pronunciation = result.pronunciationScore || 0;
  const fluency = result.fluencyScore || 0;
  const rhythm = result.rhythmScore !== undefined ? result.rhythmScore : Math.max(0, Math.round(fluency * 0.96));
  const intonation = result.intonationScore !== undefined ? result.intonationScore : Math.max(0, Math.round(pronunciation * 0.94));
  const stress = result.stressScore !== undefined ? result.stressScore : Math.max(0, Math.round(pronunciation * 0.92));

  // Safe mapping of feedback to array
  const rawFeedback = result.feedback;
  const feedbackList: string[] = Array.isArray(rawFeedback)
    ? rawFeedback
    : typeof rawFeedback === "string" && (rawFeedback as string).trim()
    ? [rawFeedback]
    : [];

  const improvementList = result.improvementTips || [];
  const issuesList = result.issues || [];
  const prosodyData = result.prosody || {
    totalDurationSeconds: 0,
    isPlaceholder: true,
  };

  // Handle re-practice button
  const handleRetry = () => {
    navigate("/speaking/record", { state: { practice } });
  };

  // Handle next practice route
  const handleNext = () => {
    navigate("/speaking");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-400">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">
          Kết Quả Luyện Nói
        </h1>
        <p className="text-sm text-slate-450 dark:text-slate-400">
          Đánh giá phát âm & nhịp điệu chi tiết từ hệ thống nhận diện
        </p>
      </div>

      {/* 1. Score Cards */}
      <SpeakingScoreCards
        overallScore={overall}
        pronunciationScore={pronunciation}
        fluencyScore={fluency}
        rhythmScore={rhythm}
        intonationScore={intonation}
        stressScore={stress}
      />

      {/* 2. Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3 width on desktop): Transcript Comparison & Issue Log */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Transcript Alignment Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              So Sánh Phát Âm Từng Từ
            </h3>
            
            <TranscriptCompare
              targetText={transcript}
              recognizedText={recognizedText}
            />
          </div>

          {/* Pronunciation issues log */}
          {issuesList && issuesList.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Lỗi Phát Âm Chi Tiết ({issuesList.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {issuesList.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 transition-colors ${
                      issue.severity === "high"
                        ? "bg-rose-50/50 border-rose-100 text-rose-905 dark:bg-rose-950/10 dark:border-rose-900/30 dark:text-rose-300"
                        : issue.severity === "medium"
                        ? "bg-amber-50/50 border-amber-100 text-amber-900 dark:bg-amber-950/10 dark:border-amber-900/30 dark:text-amber-300"
                        : "bg-slate-50 border-slate-100 text-slate-705 dark:bg-slate-950/20 dark:border-slate-800/60 dark:text-slate-300"
                    }`}
                  >
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 mt-0.5 ${
                        issue.severity === "high"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                          : issue.severity === "medium"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-850 dark:text-slate-400"
                      }`}
                    >
                      {issue.severity === "high" ? "Nghiêm trọng" : issue.severity === "medium" ? "Trung bình" : "Nhẹ"}
                    </span>
                    <div className="space-y-1">
                      {issue.word && (
                        <span className="font-bold block text-sm underline decoration-wavy decoration-current">
                          {issue.word}
                        </span>
                      )}
                      <p className="text-slate-600 dark:text-slate-350">{issue.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
 
        {/* Right Column (1/3 width on desktop): Feedback & Prosody previews */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Coaching Recommendations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Đánh Giá Của Giáo Viên AI
            </h3>
            
            <div className="space-y-3.5">
              {feedbackList.map((fb, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/20 rounded-2xl text-xs md:text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed"
                >
                  {fb}
                </div>
              ))}
            </div>

            {improvementList.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                  Gợi Ý Cải Thiện
                </h4>
                <ul className="text-xs md:text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                  {improvementList.map((tip, idx) => (
                    <li key={idx} className="leading-relaxed">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
 
          {/* Prosody Visual Analytics (placeholder visualizer) */}
          <ProsodyPreviewPanel prosody={prosodyData} />
        </div>
      </div>

      {/* 3. Bottom CTA Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 shrink-0">
        <button
          onClick={handleRetry}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 hover:shadow transition-all duration-205"
        >
          <RotateCcw className="w-5 h-5" /> Luyện tập lại
        </button>
        <button
          onClick={handleNext}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-105 active:scale-98 transition-all duration-205"
        >
          Bài tiếp theo <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
export default SpeakingResultView;
