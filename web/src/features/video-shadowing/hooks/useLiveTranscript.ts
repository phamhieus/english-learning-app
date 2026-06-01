// Live (interim) transcript shown while the user is recording, via the browser
// Web Speech API. NOTE: in some browsers (e.g. Chrome) this recognizer runs
// ONLINE — so this is on-screen feedback only. The saved/scored transcript is
// produced fully on-device by Whisper (see transcriptionService).

import { useCallback, useRef, useState } from 'react';
import { createSpeechRecognition, type SpeechRecognition, type SpeechRecognitionEvent } from '../../../services/speechRecognition';

interface UseLiveTranscript {
  supported: boolean;
  /** Finalized text so far. */
  transcript: string;
  /** Current in-progress (interim) words. */
  interim: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useLiveTranscript(lang = 'en-US'): UseLiveTranscript {
  const supported =
    typeof window !== 'undefined' && !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const recRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef('');

  const start = useCallback(() => {
    const rec = createSpeechRecognition();
    if (!rec) return;
    recRef.current = rec;
    finalRef.current = '';
    setTranscript('');
    setInterim('');
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interimStr = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0]?.transcript ?? '';
        if (res.isFinal) finalRef.current += `${text} `;
        else interimStr += text;
      }
      setTranscript(finalRef.current.trim());
      setInterim(interimStr.trim());
    };
    rec.onerror = () => {};
    rec.onend = () => setInterim('');
    try {
      rec.start();
    } catch {
      /* already started */
    }
  }, [lang]);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    setInterim('');
  }, []);

  const reset = useCallback(() => {
    finalRef.current = '';
    setTranscript('');
    setInterim('');
  }, []);

  return { supported, transcript, interim, start, stop, reset };
}
