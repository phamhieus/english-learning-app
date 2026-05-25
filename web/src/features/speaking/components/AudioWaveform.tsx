import React from "react";
import { useAudioWaveform } from "../hooks/useAudioWaveform";

interface AudioWaveformProps {
  isRecording: boolean;
  mediaStream?: MediaStream | null;
}

export function AudioWaveform({ isRecording, mediaStream }: AudioWaveformProps) {
  const barCount = 28;
  const { bars } = useAudioWaveform({ isRecording, mediaStream, barCount });

  return (
    <div className="flex items-center justify-center gap-1.5 h-20 w-full px-4 overflow-hidden">
      {bars.map((height, index) => (
        <div
          key={index}
          className={`w-1 md:w-1.5 rounded-full transition-all duration-70 ${
            isRecording
              ? height > 15
                ? "bg-gradient-to-t from-indigo-600 via-purple-500 to-indigo-400 dark:from-indigo-500 dark:via-purple-400 dark:to-indigo-300"
                : "bg-indigo-400/80 dark:bg-indigo-600/80"
              : "bg-slate-200 dark:bg-slate-800"
          }`}
          style={{
            height: `${height}px`,
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      ))}
    </div>
  );
}
export default AudioWaveform;
