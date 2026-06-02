import React from "react";
import { useLocation } from "react-router-dom";
import SpeakingResultView from "../features/speaking/components/SpeakingResultView";

const SpeakingResult = () => {
  const location = useLocation();
  const { result, recognizedText, transcript, practice } = location.state || {};

  if (!result) {
    return (
      <div className="p-8 text-center text-slate-500">
        Practice result not found. Please try again.
      </div>
    );
  }

  return (
    <SpeakingResultView
      result={result}
      practice={practice}
      recognizedText={recognizedText}
      transcript={transcript}
    />
  );
};

export default SpeakingResult;
