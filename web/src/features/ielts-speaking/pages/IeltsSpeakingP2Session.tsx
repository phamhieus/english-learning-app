import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Clock, Mic, RefreshCw, Trash2, Volume2 } from 'lucide-react';
import { cn } from '../../../components/classNames';
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
          <button onClick={() => navigate('/speaking')} className="text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white">
            Back
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
        <button onClick={() => navigate('/speaking/ielts')} className="text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white">
          Exit
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">IELTS Speaking Part 2 - Long Turn</span>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {phase === 'prep' ? 'Preparation' : phase === 'long_turn' ? 'Speaking' : 'Follow-up'}
          </span>
        </div>
      </div>

      {phase === 'prep' && (
        <div className="grid xl:grid-cols-[1fr_1.1fr_0.8fr] gap-5">
          <section className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">Cue card</p>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{cueCard.title}</h1>
              </div>
              <button
                onClick={() => reader.speakSegments(makeVoiceReaderSegments([cueCard.prompt, ...cueCard.bulletPoints, cueCard.explanationPrompt]), { mode: 'single' })}
                className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 hover:scale-105 transition-transform"
                aria-label="Read cue card aloud"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-5 mb-5">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">{cueCard.prompt}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">You should say</p>
              <ul className="space-y-2.5">
                {cueCard.bulletPoints.map((point) => (
                  <li key={point} className="flex gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" /> {point}
                  </li>
                ))}
              </ul>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-4">{cueCard.explanationPrompt}</p>
            </div>

            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300">
                  <Clock className="w-4 h-4" /> Preparation time
                </p>
                <span className="text-3xl font-black tabular-nums text-amber-700 dark:text-amber-300">{prepLeft}s</span>
              </div>
              <div className="h-2 rounded-full bg-amber-100 dark:bg-amber-900/30 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${prepProgress}%` }} />
              </div>
            </div>
          </section>

          <section className="glass-card rounded-2xl p-5 border border-transparent flex flex-col min-h-[560px]">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Preparation notes</label>
              <button onClick={() => setNotes('')} className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Clear notes
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="flex-1 w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 text-base leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              placeholder="Write keywords, not full sentences..."
            />
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button onClick={startLongTurn} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20">
                <Mic className="w-5 h-5" /> Start speaking now
              </button>
              <button onClick={() => reader.speakSegments(makeVoiceReaderSegments([cueCard.prompt]), { mode: 'single' })} className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
                <Volume2 className="w-4 h-4" /> Replay
              </button>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Plan your answer</p>
              <ol className="space-y-2">
                {cueCard.preparationFramework?.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300 text-xs font-black flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Useful language</p>
              <div className="flex flex-wrap gap-2">
                {cueCard.vocabularyHints?.map((hint) => (
                  <span key={hint} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300">
                    {hint}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {phase === 'long_turn' && (
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-5">
          <aside className="space-y-4">
            <section className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">Cue card</p>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">{cueCard.title}</h2>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">{cueCard.prompt}</p>
              <ul className="space-y-1.5">
                {cueCard.bulletPoints.map((point) => (
                  <li key={point} className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-indigo-500">-</span> {point}
                  </li>
                ))}
              </ul>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-3">{cueCard.explanationPrompt}</p>
            </section>
            <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Your notes</p>
              <p className="min-h-28 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {notes || 'No notes written during preparation.'}
              </p>
            </section>
          </aside>

          <section className="glass-card rounded-2xl p-5 border border-transparent flex flex-col min-h-[560px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Speaking now</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Speak continuously for 1 to 2 minutes.</p>
              </div>
              <p className="text-5xl font-black tabular-nums text-indigo-600 dark:text-indigo-400">{speakingSeconds}s</p>
            </div>

            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${speakingProgress}%` }} />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {[60, 90, 120].map((mark) => (
                <div key={mark} className={cn('rounded-xl p-2 text-center text-xs font-bold border', speakingSeconds >= mark ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800/40' : 'text-slate-400 border-slate-200 dark:border-slate-700')}>
                  {mark === 60 ? '60s reached' : `${mark}s`}
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center justify-center gap-4 py-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mb-5">
              <button onClick={finishLongTurn} className="relative w-24 h-24 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center hover:bg-indigo-700 transition-colors">
                <span className="absolute inset-0 rounded-full border-4 border-indigo-400 animate-ping opacity-50" />
                <Mic className="w-10 h-10" />
              </button>
              <WaveformBars active={speech.isListening} />
              <p className="text-xs text-slate-400">Recording - tap the microphone or Finish when your answer is complete</p>
            </div>

            <TranscriptBox text={liveText} placeholder="Realtime transcript will appear here while you speak..." />
            <button onClick={finishLongTurn} className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">
              Finish answer <ChevronRight className="w-4 h-4" />
            </button>
          </section>
        </div>
      )}

      {phase === 'rounding_off' && currentFollowUp && (
        <section className="max-w-3xl mx-auto glass-card rounded-2xl p-5 border border-transparent flex flex-col min-h-[520px]">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Rounding-off question {roundingIndex + 1}</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{currentFollowUp.text}</h2>
          <TranscriptBox text={liveText} placeholder="Give a short direct answer..." />
          <button onClick={finishFollowUp} className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">
            {roundingIndex + 1 >= cueCard.roundingOffQuestions.length ? 'Finish Part 2' : 'Next question'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>
      )}
    </div>
  );
};

function TranscriptBox({ text, placeholder }: { text: string; placeholder: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 min-h-52">
      {text ? (
        <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">{text}</p>
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
