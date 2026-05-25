import { useState, useRef, useEffect, useCallback } from "react";

export function useMicrophoneRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    setError(null);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setDurationSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      setMediaStream(stream);
      audioChunksRef.current = [];
      
      const options = { mimeType: "audio/webm" };
      let mediaRecorder: MediaRecorder;
      
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); 
      setIsRecording(true);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDurationSeconds(Number(((Date.now() - startTime) / 1000).toFixed(1)));
      }, 100);

    } catch (err: any) {
      console.error("Microphone access failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Không thể truy cập microphone. Vui lòng kiểm tra quyền microphone.");
      } else {
        setError("Trình duyệt hiện tại chưa hỗ trợ ghi âm hoặc thiết bị lỗi.");
      }
      throw err;
    }
  };

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (recorder && isRecording) {
        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          
          recorder.stream.getTracks().forEach((track) => track.stop());
          resolve(blob);
        };
        recorder.stop();
        setIsRecording(false);
      } else {
        reject(new Error("Recording is not active"));
      }
    });
  };

  const resetRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorder) {
      try {
        recorder.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
    }
    setIsRecording(false);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    audioChunksRef.current = [];
    setDurationSeconds(0);
    setError(null);
    setMediaStream(null);
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      resetRecording();
    };
  }, [resetRecording]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    error,
    mediaStream,
    durationSeconds,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
