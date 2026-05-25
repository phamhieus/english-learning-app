import { useState, useEffect, useRef } from "react";

interface UseAudioWaveformProps {
  isRecording: boolean;
  barCount?: number;
  mediaStream?: MediaStream | null;
}

export function useAudioWaveform({ isRecording, barCount = 28 }: UseAudioWaveformProps) {
  const [bars, setBars] = useState<number[]>(Array(barCount).fill(4));
  const requestRef = useRef<number>(0);

  useEffect(() => {
    if (!isRecording) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      setBars(Array(barCount).fill(4));
      return;
    }

    // Mock volume animation
    let lastUpdate = Date.now();
    
    const animate = () => {
      const now = Date.now();
      if (now - lastUpdate > 50) {
        setBars((prev) =>
          prev.map(() => {
            const min = 4;
            const max = 32;
            // Generate a random height, weighted towards lower values
            const random = Math.random();
            const height = min + Math.pow(random, 2) * (max - min);
            return height;
          })
        );
        lastUpdate = now;
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRecording, barCount]);

  return { bars };
}
