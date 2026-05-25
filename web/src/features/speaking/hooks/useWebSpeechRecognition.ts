import { useState, useEffect, useRef, useCallback } from "react";

export function useWebSpeechRecognition(language: "en" | "vi" = "en") {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const accumulatedFinalRef = useRef("");
  const shouldRestartRef = useRef(false);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Browser does not support Web Speech API SpeechRecognition.");
      return;
    }

    shouldRestartRef.current = true;
    accumulatedFinalRef.current = "";
    setTranscript("");

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === "en" ? "en-US" : "vi-VN";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            accumulatedFinalRef.current += text + " ";
          } else {
            interimTranscript += text;
          }
        }

        const fullText = (accumulatedFinalRef.current + interimTranscript).trim();
        setTranscript(fullText);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          shouldRestartRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (shouldRestartRef.current) {
          try {
            // Auto restart if still recording
            recognition.start();
          } catch (e) {
            console.error("Failed to auto-restart recognition:", e);
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Failed to start SpeechRecognition:", e);
    }
  }, [language]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    accumulatedFinalRef.current = "";
    setTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
  };
}
