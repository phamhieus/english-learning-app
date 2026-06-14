import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Check, ArrowLeft, Timer, ListChecks, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../components/classNames';
import { useSettings } from '../components/useSettings';
import { useToast } from '../components/useToast';
import { createSpeechRecognition, type SpeechRecognition } from '../services/speechRecognition';
import { TOEIC_SPEAKING_TIMING } from '../services/examTiming';
import {
  generateSpeakingTaskContent,
  evaluateSpeakingResponses,
  type SpeakingResponseTask,
  type SpeakingTaskContent,
} from '../services/ai';
import { addHistory } from '../services/storage';
import { VoiceReaderControls } from '../features/voice-reader/VoiceReaderControls';
import { splitVoiceReaderText } from '../features/voice-reader/voiceReaderText';
import { useVoiceReader } from '../features/voice-reader/useVoiceReader';

type Phase = 'loading' | 'prep' | 'answering' | 'submitting';

const TASK_TITLES: Record<SpeakingResponseTask, { label: string; q: string }> = {
  resp: { label: 'Respond to Questions', q: 'Q5–7' },
  info: { label: 'Respond Using Information', q: 'Q8–10' },
  op: { label: 'Express an Opinion', q: 'Q11' },
};

const SpeakingResponse = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const { error: showError, success: showSuccess } = useToast();

  const practice = useMemo(
    () => location.state?.practice || { id: 0, title: 'General Practice', level: 'Medium', type: 'Personal response' },
    [location.state],
  );
  const taskKey = ((location.state?.taskKey as string) || 'resp') as SpeakingResponseTask;
  const meta = TASK_TITLES[taskKey] ?? TASK_TITLES.resp;

  const timing = TOEIC_SPEAKING_TIMING[taskKey];
  const responseSecondsByQuestion = useMemo(
    () => timing.responseSecondsByQuestion ?? [timing.responseSeconds],
    [timing],
  );

  const [phase, setPhase] = useState<Phase>('loading');
  const [content, setContent] = useState<SpeakingTaskContent | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [recognizedText, setRecognizedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [prepLeft, setPrepLeft] = useState<number | null>(null);
  const [responseLeft, setResponseLeft] = useState<number | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef('');

  const questions = content?.questions ?? [];
  const currentQuestion = questions[qIndex] ?? '';
  const voiceSegments = useMemo(() => splitVoiceReaderText(currentQuestion), [currentQuestion]);
  const voiceReader = useVoiceReader({ exerciseId: `speaking-resp-${practice.id ?? practice.title}-${qIndex}` });

  // ── Speech recognition setup ──────────────────────────────────────────────
  useEffect(() => {
    const recognition = createSpeechRecognition();
    if (!recognition) {
      showError('Speech Recognition is not supported in this browser.');
      return;
    }
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalRef.current += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setRecognizedText(finalRef.current + interim);
    };
    recognitionRef.current = recognition;
  }, [showError]);

  // ── Load the task content ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await generateSpeakingTaskContent(settings, taskKey, practice.title, practice.level);
        if (cancelled) return;
        setContent(result);
        setAnswers(new Array(result.questions.length).fill(''));
        if (timing.prepSeconds > 0) {
          setPhase('prep');
          setPrepLeft(timing.prepSeconds);
        } else {
          setPhase('answering');
        }
      } catch {
        if (cancelled) return;
        showError('Failed to generate the speaking task. Please try again.');
        navigate(-1);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Prep countdown (Q8-10 read info, Q11 think) ───────────────────────────
  useEffect(() => {
    if (phase !== 'prep' || prepLeft === null) return;
    if (prepLeft <= 0) {
      setPrepLeft(null);
      setPhase('answering');
      return;
    }
    const t = setTimeout(() => setPrepLeft((v) => (v === null ? null : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [phase, prepLeft]);

  // ── Read each question aloud when it becomes active ───────────────────────
  useEffect(() => {
    if (phase !== 'answering' || voiceSegments.length === 0) return;
    voiceReader.speakSegments(voiceSegments, { mode: 'sequence' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex, voiceSegments.length]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setResponseLeft(null);
  }, []);

  const startRecording = useCallback(() => {
    voiceReader.stop();
    document.querySelectorAll('audio').forEach((a) => { a.pause(); a.currentTime = 0; });
    finalRef.current = '';
    setRecognizedText('');
    recognitionRef.current?.start();
    setIsRecording(true);
    setResponseLeft(responseSecondsByQuestion[qIndex] ?? timing.responseSeconds);
  }, [voiceReader, qIndex, responseSecondsByQuestion, timing.responseSeconds]);

  const submit = useCallback(async (allAnswers: string[]) => {
    if (!content) return;
    setPhase('submitting');
    try {
      const items = content.questions.map((q, i) => ({ question: q, answer: allAnswers[i] ?? '' }));
      const result = await evaluateSpeakingResponses(settings, taskKey, items, {
        scenario: content.scenario,
        info: content.info,
      });
      addHistory({ title: practice.title, type: meta.label, score: result.score, focus: 'Speaking' });
      showSuccess('Evaluation completed!');
      navigate('/speaking/respond/result', {
        state: { result, content, answers: allAnswers, practice, taskKey, taskLabel: meta.label },
      });
    } catch {
      showError('Failed to evaluate your answers.');
      setPhase('answering');
    }
  }, [content, settings, taskKey, practice, meta.label, showSuccess, showError, navigate]);

  const goToNextOrSubmit = useCallback(() => {
    const captured = (finalRef.current || recognizedText).trim();
    const nextAnswers = [...answers];
    nextAnswers[qIndex] = captured;
    setAnswers(nextAnswers);
    setRecognizedText('');
    finalRef.current = '';
    if (qIndex < questions.length - 1) {
      setQIndex((i) => i + 1);
    } else {
      submit(nextAnswers);
    }
  }, [answers, qIndex, questions.length, recognizedText, submit]);

  // Always call the latest goToNextOrSubmit from fire-and-forget timers, so the
  // auto-advance survives the re-render that follows stopping the recording.
  const goToNextOrSubmitRef = useRef(goToNextOrSubmit);
  useEffect(() => { goToNextOrSubmitRef.current = goToNextOrSubmit; });

  // ── Response countdown — auto-stop and advance when time is up ─────────────
  useEffect(() => {
    if (!isRecording || responseLeft === null) return;
    if (responseLeft <= 0) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setResponseLeft(null);
      // Fire-and-forget so the effect cleanup can't cancel it; give the
      // recognizer a beat to flush its final transcript first.
      window.setTimeout(() => goToNextOrSubmitRef.current(), 400);
      return;
    }
    const t = setTimeout(() => setResponseLeft((v) => (v === null ? null : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [isRecording, responseLeft]);

  const handleMicTap = () => {
    if (isRecording) {
      stopRecording();
      setTimeout(() => goToNextOrSubmit(), 300);
    } else {
      startRecording();
    }
  };

  const isLastQuestion = qIndex === questions.length - 1;

  return (
    <div className="max-w-4xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>
        <div className="flex gap-2 items-center">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">TOEIC</span>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full text-sm font-semibold">{meta.label}</span>
          {phase === 'prep' && prepLeft !== null && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold tabular-nums bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Timer className="w-4 h-4" /> Prep 0:{String(prepLeft).padStart(2, '0')}
            </span>
          )}
          {isRecording && responseLeft !== null && (
            <span className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold tabular-nums',
              responseLeft <= 10 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            )}>
              <Timer className="w-4 h-4" /> Speak 0:{String(Math.max(responseLeft, 0)).padStart(2, '0')}
            </span>
          )}
        </div>
      </div>

      {phase === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-medium">Preparing your {meta.label} task...</p>
        </div>
      )}

      {phase === 'submitting' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-medium">Evaluating your answers...</p>
        </div>
      )}

      {content && (phase === 'prep' || phase === 'answering') && (
        <div className="flex-1 flex flex-col gap-6">
          {/* Scenario */}
          {content.scenario && (
            <div className="glass-card rounded-2xl p-5 border-l-4 border-indigo-400">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Situation</p>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 leading-relaxed">{content.scenario}</p>
            </div>
          )}

          {/* Reference information (Q8-10) */}
          {content.info && (
            <div className="glass-card rounded-2xl p-5">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-indigo-500" /> {content.info.title}
              </p>
              <ul className="space-y-1.5">
                {content.info.lines.map((line, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>{line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {phase === 'prep' ? (
            <div className="mt-auto flex flex-col items-center gap-4 pb-6">
              {/* Show the opinion question during prep (Q11 has no scenario/info). */}
              {!content.info && currentQuestion && (
                <div className="w-full glass-card rounded-3xl p-6 sm:p-8 shadow-lg">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Your question</p>
                  <p className="text-xl sm:text-2xl font-medium leading-relaxed text-slate-800 dark:text-slate-200">{currentQuestion}</p>
                </div>
              )}
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                {content.info ? 'Read the information above.' : 'Think about your answer.'} Answering starts when prep time ends.
              </p>
              <button
                onClick={() => { setPrepLeft(null); setPhase('answering'); }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-colors"
              >
                I'm ready <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="flex items-center justify-center gap-2">
                {questions.map((_, i) => (
                  <span key={i} className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === qIndex ? 'w-8 bg-indigo-600' : i < qIndex ? 'w-4 bg-indigo-300' : 'w-4 bg-slate-200 dark:bg-slate-700'
                  )} />
                ))}
              </div>

              {/* Current question */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 relative shadow-lg">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Question {qIndex + 1} of {questions.length} · {Math.round(responseSecondsByQuestion[qIndex] ?? timing.responseSeconds)}s to answer
                </p>
                <p className="text-xl sm:text-2xl font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                  {voiceSegments.map((segment) => (
                    <span key={segment.id} className={cn(
                      'rounded-lg transition-colors',
                      voiceReader.activeSegmentId === segment.id && 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200'
                    )}>
                      {segment.text}{' '}
                    </span>
                  ))}
                </p>
                <VoiceReaderControls
                  className="mt-5"
                  supported={voiceReader.supported}
                  globallyEnabled={voiceReader.globalVoiceReaderEnabled}
                  muted={voiceReader.isTemporarilyMuted}
                  onChange={voiceReader.setTemporarilyMuted}
                  status={voiceReader.status}
                  canPlay={voiceReader.canPlayAudio}
                  onPlay={() => voiceReader.speakSegments(voiceSegments, { mode: 'sequence' })}
                  onPause={voiceReader.pause}
                  onResume={voiceReader.resume}
                  onReplay={() => voiceReader.speakSegments(voiceSegments, { mode: 'sequence' })}
                  onStop={voiceReader.stop}
                />
              </div>

              {/* Live transcript */}
              <div className="text-center min-h-[48px] px-4">
                {recognizedText ? (
                  <p className="text-lg text-slate-600 dark:text-slate-300 italic">"{recognizedText}"</p>
                ) : isRecording ? (
                  <p className="text-base text-slate-400 italic">Listening...</p>
                ) : (
                  <p className="text-base text-slate-400">Tap the mic, then answer the question aloud.</p>
                )}
              </div>

              {/* Controls */}
              <div className="mt-auto flex flex-col items-center gap-4 pb-6">
                <button
                  onClick={handleMicTap}
                  className={cn(
                    'w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative',
                    isRecording ? 'bg-indigo-600 dark:bg-indigo-500 shadow-indigo-500/50 scale-110'
                      : 'bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900 shadow-indigo-500/10 hover:scale-105'
                  )}
                >
                  {isRecording && <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-ping opacity-75" />}
                  <Mic className={cn('w-10 h-10', isRecording ? 'text-white animate-pulse' : 'text-indigo-500 dark:text-indigo-400')} />
                </button>
                <p className="text-sm font-medium text-slate-400">
                  {isRecording ? 'Click to stop & continue' : 'Click to start your timed answer'}
                </p>
                {!isRecording && (recognizedText || answers[qIndex]) && (
                  <button onClick={goToNextOrSubmit} className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold hover:underline">
                    {isLastQuestion ? <>Finish & evaluate <Check className="w-4 h-4" /></> : <>Next question <ChevronRight className="w-4 h-4" /></>}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeakingResponse;
