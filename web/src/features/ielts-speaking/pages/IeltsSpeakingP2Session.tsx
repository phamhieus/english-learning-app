import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Mic,
  RefreshCw,
  Trash2,
  Volume2,
  ChevronDown,
  Pencil,
  Eraser,
  CheckCircle2,
  ListTodo,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../../../components/classNames';
import { useTheme } from '../../../components/useTheme';
import { useSpeechRecognition } from '../../../services/useSpeechRecognition';
import { useVoiceReader } from '../../voice-reader/useVoiceReader';
import { makeVoiceReaderSegments } from '../../voice-reader/voiceReaderText';
import { PART2_CUE_CARDS, getRandomCueCard } from '../data/part2CueCards';
import type { IeltsP2AnswerInput, Part2CueCard } from '../types/ielts-speaking.types';

type Phase = 'prep' | 'long_turn' | 'rounding_off' | 'complete';

const PREP_SECONDS = 60;
const MAX_LONG_TURN_SECONDS = 120;
const PART2_CATEGORIES = Array.from(new Set(PART2_CUE_CARDS.map((card) => card.category)));

const IeltsSpeakingP2Session = () => {
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedId = (location.state as { cueCardId?: string } | null)?.cueCardId;
  const cueCard = useMemo<Part2CueCard>(
    () => PART2_CUE_CARDS.find((card) => card.id === selectedId) ?? getRandomCueCard(),
    [selectedId],
  );
  const speech = useSpeechRecognition({ continuous: true, interimResults: true });
  const reader = useVoiceReader({ exerciseId: `ielts-p2-${cueCard.id}` });

  const sessionStartRef = useRef(Date.now());
  const answerStartRef = useRef(Date.now());
  const longTurnRef = useRef<IeltsP2AnswerInput | null>(null);
  const [phase, setPhase] = useState<Phase>('prep');
  const [prepLeft, setPrepLeft] = useState(PREP_SECONDS);
  const [speakingSeconds, setSpeakingSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [roundingIndex, setRoundingIndex] = useState(0);
  const [longTurn, setLongTurn] = useState<IeltsP2AnswerInput | null>(null);
  const [roundingAnswers, setRoundingAnswers] = useState<IeltsP2AnswerInput[]>([]);

  const liveText = speech.transcript + (speech.interimTranscript ? ` ${speech.interimTranscript}` : '');
  const currentFollowUp = cueCard.roundingOffQuestions[roundingIndex];

  useEffect(() => {
    if (!selectedId) return;
    if (phase !== 'prep') return;
    if (prepLeft <= 0) return;
    const timer = setTimeout(() => setPrepLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [selectedId, phase, prepLeft]);

  useEffect(() => {
    if (!selectedId) return;
    if (phase !== 'long_turn') return;
    const timer = setInterval(() => {
      setSpeakingSeconds((value) => {
        if (value + 1 >= MAX_LONG_TURN_SECONDS) {
          setTimeout(() => finishLongTurn(), 0);
        }
        return Math.min(value + 1, MAX_LONG_TURN_SECONDS);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedId, phase]);

  // Reset session state whenever the user picks a different cue card.
  // Without this, phase/roundingIndex from the previous card bleed into the
  // new session and cause mismatched (apparently random) questions.
  useEffect(() => {
    if (!selectedId) return;
    speech.stop();
    reader.stop();
    speech.reset();
    setPhase('prep');
    setPrepLeft(PREP_SECONDS);
    setSpeakingSeconds(0);
    setNotes('');
    setRoundingIndex(0);
    setLongTurn(null);
    setRoundingAnswers([]);
    longTurnRef.current = null;
    sessionStartRef.current = Date.now();
    answerStartRef.current = Date.now();
  }, [selectedId]);

  useEffect(() => () => {
    speech.stop();
    reader.stop();
  }, []);

  const startLongTurn = () => {
    reader.stop();
    speech.reset();
    setSpeakingSeconds(0);
    answerStartRef.current = Date.now();
    setPhase('long_turn');
    speech.start();
  };

  const finishLongTurn = () => {
    speech.stop();
    const transcript = liveText.trim();
    const longTurnRecord = {
      questionId: cueCard.id,
      question: `${cueCard.prompt} ${cueCard.explanationPrompt}`,
      transcript,
      durationSeconds: Math.max(1, Math.round((Date.now() - answerStartRef.current) / 1000)),
      turnType: 'long_turn',
    } satisfies IeltsP2AnswerInput;
    longTurnRef.current = longTurnRecord;
    setLongTurn(longTurnRecord);
    speech.reset();
    setPhase('rounding_off');
    answerStartRef.current = Date.now();
    if (currentFollowUp) {
      reader.speakSegments(makeVoiceReaderSegments([currentFollowUp.text]), { mode: 'single' });
    }
    speech.start();
  };

  const finishFollowUp = () => {
    if (!currentFollowUp) return;
    const nextAnswers = [
      ...roundingAnswers,
      {
        questionId: currentFollowUp.id,
        question: currentFollowUp.text,
        transcript: liveText.trim(),
        durationSeconds: Math.max(1, Math.round((Date.now() - answerStartRef.current) / 1000)),
        turnType: 'rounding_off' as const,
      },
    ];
    setRoundingAnswers(nextAnswers);
    speech.reset();

    if (roundingIndex + 1 >= cueCard.roundingOffQuestions.length) {
      setPhase('complete');
      navigate('/speaking/ielts/result', {
        state: {
          part: 'part_2',
          cueCard,
          notes,
          durationSeconds: Math.round((Date.now() - sessionStartRef.current) / 1000),
          longTurn: longTurnRef.current ?? longTurn,
          roundingOff: nextAnswers,
        },
      });
      return;
    }

    const nextIndex = roundingIndex + 1;
    setRoundingIndex(nextIndex);
    answerStartRef.current = Date.now();
    const next = cueCard.roundingOffQuestions[nextIndex];
    reader.speakSegments(makeVoiceReaderSegments([next.text]), { mode: 'single' });
    speech.start();
  };

  if (!selectedId) {
    return (
      <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={() => navigate('/speaking/ielts')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => navigate('/speaking/ielts/part-2', { state: { cueCardId: getRandomCueCard().id } })}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
          >
            <RefreshCw className="w-4 h-4" /> Random cue card
          </button>
        </div>

        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-2">
            IELTS Speaking Part 2 - Long Turn
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Choose a cue card</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Pick a topic first, then you will get 60 seconds to prepare before the long turn starts.
          </p>
        </div>

        <div className="space-y-8">
          {PART2_CATEGORIES.map((category) => {
            const cards = PART2_CUE_CARDS.filter((card) => card.category === category);
            return (
              <section key={category}>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  {category.replace('_', ' ')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {cards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => navigate('/speaking/ielts/part-2', { state: { cueCardId: card.id } })}
                      className="text-left glass-card rounded-2xl p-4 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/60 hover:-translate-y-1 transition-all"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">{card.category.replace('_', ' ')}</p>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{card.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{card.prompt}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-300">
                        Start practice <ChevronRight className="w-4 h-4" />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  const prepProgress = ((PREP_SECONDS - prepLeft) / PREP_SECONDS) * 100;
  const speakingProgress = (speakingSeconds / MAX_LONG_TURN_SECONDS) * 100;

  return (
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-8rem)] animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-3 mb-5">
        <button
          onClick={() => navigate('/speaking/ielts')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">IELTS Speaking Part 2 - Long Turn</span>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {phase === 'prep' ? 'Preparation' : phase === 'long_turn' ? 'Speaking' : 'Follow-up'}
          </span>
        </div>
      </div>

      {phase === 'prep' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Cue card + prep timer */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-4 mb-4 glass-card rounded-2xl p-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg width="80" height="80" className="-rotate-90">
                  <circle cx="40" cy="40" r={34} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="7" fill="none" />
                  <circle
                    cx="40"
                    cy="40"
                    r={34}
                    className="stroke-cyan-500"
                    strokeWidth="7"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * ((PREP_SECONDS - prepLeft) / PREP_SECONDS)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black tabular-nums text-slate-800 dark:text-slate-100">
                    0:{String(prepLeft).padStart(2, '0')}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-0.5">Preparation time</p>
                  {reader.status === 'playing' && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-400 font-normal">
                      <Volume2 className="w-3 h-3 animate-pulse" /> Reading card…
                    </span>
                  )}
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">You have 1 minute to prepare</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Make notes, then you'll speak for 1–2 minutes.</p>
              </div>
            </div>

            {/* Styled Cue Card */}
            <div className="rounded-3xl border-2 border-cyan-200 dark:border-cyan-800 bg-gradient-to-br from-cyan-50/60 to-white dark:from-cyan-950/20 dark:to-slate-900 shadow-sm p-7">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                  Task Card
                </span>
                <button
                  onClick={() => reader.speakSegments(makeVoiceReaderSegments([cueCard.prompt, ...cueCard.bulletPoints, cueCard.explanationPrompt]), { mode: 'single' })}
                  className="p-1.5 rounded-lg bg-cyan-100/50 hover:bg-cyan-100 dark:bg-cyan-950/50 dark:hover:bg-cyan-950 text-cyan-700 dark:text-cyan-300 hover:scale-105 transition-all"
                  aria-label="Read cue card aloud"
                >
                  <Volume2 className={cn("w-3.5 h-3.5", reader.status === 'playing' && "animate-pulse")} />
                </button>
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-100 leading-snug mb-4 text-2xl">{cueCard.prompt}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">You should say:</p>
              <ul className="space-y-1.5 mb-4">
                {cueCard.bulletPoints.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-200 text-[15px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" /> {b}
                  </li>
                ))}
              </ul>
              <p className="text-[15px] font-semibold text-slate-600 dark:text-slate-300 italic">{cueCard.explanationPrompt}</p>
            </div>
          </div>

          {/* Notes + framework */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="glass-card rounded-2xl p-4 flex flex-col min-h-[240px]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Your notes
                </p>
                <button onClick={() => setNotes('')} className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1">
                  <Eraser className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full flex-1 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 min-h-[150px] text-[15px] leading-7 text-slate-700 dark:text-slate-300 outline-none resize-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(transparent, transparent 27px, ${resolvedTheme === 'dark' ? '#334155' : '#e2e8f0'} 27px, ${resolvedTheme === 'dark' ? '#334155' : '#e2e8f0'} 28px)`,
                  lineHeight: '28px',
                  paddingTop: '2px',
                }}
                placeholder="Write keywords, not full sentences..."
              />
            </div>

            {cueCard.preparationFramework && (
              <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 p-4">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <ListTodo className="w-3.5 h-3.5" /> Preparation framework
                </p>
                <ol className="space-y-1.5">
                  {cueCard.preparationFramework.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-indigo-900/80 dark:text-indigo-200/80">
                      <span className="w-5 h-5 rounded-full bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {cueCard.vocabularyHints?.map((v, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-medium"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Full-width start button */}
          <div className="lg:col-span-5 mt-2">
            <button
              onClick={startLongTurn}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.01] transition-all"
            >
              <Mic className="w-5 h-5" /> Start speaking now
            </button>
          </div>
        </div>
      )}

      {phase === 'long_turn' && (
        <div className="max-w-3xl mx-auto h-full flex flex-col space-y-5">
          {/* Timer + milestones */}
          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Speaking time</p>
                <p className="text-4xl font-black tabular-nums text-slate-800 dark:text-slate-100 leading-none mt-1">
                  {Math.floor(speakingSeconds / 60)}:{String(speakingSeconds % 60).padStart(2, '0')}
                </p>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold border border-red-100 dark:border-red-900/30">
                <span className="relative inline-flex">
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" />
                  <span className="relative w-2 h-2 rounded-full bg-red-500" />
                </span>
                Recording
              </span>
            </div>
            <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-4">
              <div
                className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full transition-all duration-1000"
                style={{ width: `${speakingProgress}%` }}
              />
              {[60, 90, 120].map((t) => (
                <div key={t} className="absolute -top-0.5" style={{ left: `${(t / 120) * 100}%` }}>
                  <span
                    className={cn(
                      'block w-3 h-3 rounded-full border-2 -translate-x-1/2 transition-colors',
                      speakingSeconds >= t
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700',
                    )}
                  />
                  <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {t === 60 ? '1:00' : t === 90 ? '1:30' : '2:00'}
                  </span>
                </div>
              ))}
            </div>
            <div
              className={cn(
                'flex items-center gap-1.5 mt-7 text-xs font-medium',
                speakingSeconds >= 60 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400',
              )}
            >
              {speakingSeconds >= 60 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Minimum length reached — keep going to 2:00
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 animate-pulse mr-1" /> Keep speaking to reach the 1-minute minimum mark
                </>
              )}
            </div>
          </div>

          {/* Collapsible Task Card & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <details className="glass-card rounded-2xl px-5 py-3.5 border border-slate-200 dark:border-slate-800" open>
              <summary className="flex items-center gap-2 cursor-pointer list-none select-none font-bold text-slate-700 dark:text-slate-300 outline-none">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 text-[10px] uppercase font-black">
                  Cue Card
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{cueCard.title}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-auto summary-chevron" />
              </summary>
              <div className="mt-3 pl-2 border-l-2 border-cyan-200 dark:border-cyan-800/40">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">{cueCard.prompt}</p>
                <ul className="space-y-1">
                  {cueCard.bulletPoints.map((b, i) => (
                    <li key={i} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-cyan-400 mt-2 shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-2">{cueCard.explanationPrompt}</p>
              </div>
            </details>

            <details className="glass-card rounded-2xl px-5 py-3.5 border border-slate-200 dark:border-slate-800" open>
              <summary className="flex items-center gap-2 cursor-pointer list-none select-none font-bold text-slate-700 dark:text-slate-300 outline-none">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-[10px] uppercase font-black">
                  Notes
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">Your notes</span>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-auto summary-chevron" />
              </summary>
              <div className="mt-3 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pl-2 border-l-2 border-amber-200 dark:border-amber-800/40 min-h-[50px] max-h-[120px] overflow-y-auto">
                {notes || 'No notes written during preparation.'}
              </div>
            </details>
          </div>

          {/* Live transcript + waveform */}
          <div className="flex-1 flex flex-col gap-4 min-h-[220px]">
            <TranscriptBox text={liveText} placeholder="Realtime transcript will appear here while you speak..." />
            <div className="h-14 flex items-center justify-center">
              <WaveformBars active={speech.isListening} />
            </div>
          </div>

          {/* Controls */}
          <div className="shrink-0 flex items-center justify-center gap-5 mt-5 pb-2">
            <button
              onClick={startLongTurn}
              className="px-5 py-3 rounded-2xl font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Try again
            </button>
            <button
              onClick={finishLongTurn}
              className="px-8 py-3.5 rounded-2xl font-bold bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 flex items-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" /> Finish answer
            </button>
          </div>
        </div>
      )}

      {phase === 'rounding_off' && currentFollowUp && (
        <div className="max-w-2xl mx-auto h-full flex flex-col space-y-6">
          <div className="shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                IELTS
              </span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Part 2 · Rounding-off · Q{roundingIndex + 1}/{cueCard.roundingOffQuestions.length}
              </span>
              {reader.status === 'playing' && (
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Reading question…
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${((roundingIndex + 0.5) / cueCard.roundingOffQuestions.length) * 100}%` }}
            />
          </div>

          <div className="shrink-0 glass-card rounded-3xl p-8 shadow-sm relative border border-slate-200 dark:border-slate-800">
            <p className="text-2xl font-semibold leading-relaxed text-slate-800 dark:text-slate-100 pr-10">
              {currentFollowUp.text}
            </p>
            <button
              onClick={() => reader.speakSegments(makeVoiceReaderSegments([currentFollowUp.text]), { mode: 'single' })}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-500 hover:scale-110 transition-transform"
              aria-label="Replay question"
            >
              <Volume2 className={cn("w-4 h-4", reader.status === 'playing' && "animate-pulse")} />
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-4 min-h-[220px]">
            <TranscriptBox text={liveText} placeholder="Give a short direct answer..." />
            <div className="h-14 flex items-center justify-center">
              <WaveformBars active={speech.isListening} />
            </div>
          </div>

          <div className="shrink-0 pt-2">
            <button
              onClick={finishFollowUp}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.01] transition-all"
            >
              {roundingIndex + 1 >= cueCard.roundingOffQuestions.length ? 'Finish Part 2' : 'Next question'}{' '}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function TranscriptBox({ text, placeholder, darkPanel = false }: { text: string; placeholder: string; darkPanel?: boolean }) {
  return (
    <div
      className={cn(
        'flex-1 rounded-2xl border p-4 min-h-52',
        darkPanel
          ? 'border-white/10 bg-white/5'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50',
      )}
    >
      {text ? (
        <p className={cn('text-base leading-relaxed', darkPanel ? 'text-slate-100' : 'text-slate-700 dark:text-slate-200')}>{text}</p>
      ) : (
        <p className="text-sm text-slate-400 italic">{placeholder}</p>
      )}
    </div>
  );
}

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end justify-center gap-1 h-10" aria-hidden="true">
      {Array.from({ length: 22 }).map((_, index) => (
        <span
          key={index}
          className={cn('w-1.5 rounded-full bg-indigo-400/80', active && 'animate-pulse')}
          style={{ height: `${10 + ((index * 13) % 28)}px`, animationDelay: `${index * 45}ms` }}
        />
      ))}
    </div>
  );
}

export default IeltsSpeakingP2Session;
