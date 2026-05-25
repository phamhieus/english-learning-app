import { useCallback } from "react";
import { addHistory } from "../../../services/storage";
import type { SpeakingAnalysisResult } from "../types/speaking.types";

export function useSpeakingAnalysis() {
  /**
   * Saves the speaking session result to the application's history log.
   */
  const saveToHistory = useCallback((
    practice: { title: string; type: string },
    result: SpeakingAnalysisResult
  ) => {
    try {
      addHistory({
        title: practice.title,
        type: practice.type || "Speaking Practice",
        score: result.overallScore,
        focus: "Speaking",
      });
    } catch (error) {
      console.error("Failed to save speaking result to storage history:", error);
    }
  }, []);

  return {
    saveToHistory,
  };
}
