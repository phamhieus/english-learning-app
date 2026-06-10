import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Clock, Type, Check, Sparkles, Circle, Maximize2, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../components/classNames';
import { OptimizedImage } from '../components/OptimizedImage';
import { thumbnailUrl } from '../components/imageUrl';
import { useSettings } from '../components/useSettings';
import { evaluateWriting } from '../services/ai';
import { addHistory } from '../services/storage';
import { useToast } from '../components/useToast';
import ChartPrompt from '../features/writing/IELTSChart';

const pictureVocab = ['foreground', 'background', 'people', 'objects', 'atmosphere'];
const colorWords = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'orange', 'grey', 'gray', 'brown', 'bright', 'dark'];
const atmosphereWords = ['busy', 'calm', 'quiet', 'crowded', 'professional', 'relaxed', 'formal', 'friendly'];
const commonMisspellings = ['becuase', 'definately', 'enviroment', 'goverment', 'imporant', 'recieve', 'seperate', 'wich', 'writting'];

const hasAnyWord = (value: string, words: string[]) => words.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(value));

const sentenceCount = (value: string) =>
  value
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean).length;

const firstSentence = (value: string) => value.split(/[.!?]+/)[0]?.trim() || '';

const WritingEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const toast = useToast();
  const practice = location.state?.practice || { id: Date.now(), title: 'Respond to a Customer Complaint', type: 'Email' };
  const taskKey = (location.state?.taskKey as string) || '';
  const taskLabel = (location.state?.taskLabel as string) || 'Writing';
  const activeExam = ((location.state?.exam as string) || settings.primaryExam) as 'TOEIC' | 'IELTS';

  const isPictureWriting =
    activeExam === 'TOEIC' &&
    (taskKey === 'pic' || taskLabel.toLowerCase().includes('picture') || practice.type?.toLowerCase().includes('picture'));
  const isChartTask =
    activeExam === 'IELTS' &&
    (taskKey === 't1a' ||
      taskLabel.toLowerCase().includes('academic') ||
      practice.title?.toLowerCase().includes('chart') ||
      practice.title?.toLowerCase().includes('graph'));
  const minWords = isPictureWriting ? 60 : isChartTask ? 150 : activeExam === 'IELTS' ? 150 : 100;
  const promptImage =
    practice.image ||
    (isPictureWriting
      ? `https://loremflickr.com/800/520/${encodeURIComponent(practice.title.split(' ').slice(0, 3).join(','))}?lock=${practice.id}`
      : '');
  // Revising returns to the same task with a blank editor — the old answer is cleared.
  const [text, setText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [timer, setTimer] = useState(isChartTask ? 1200 : isPictureWriting ? 480 : 600);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const playTone = useCallback((frequency: number, duration: number, peak = 0.16) => {
    try {
      const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtor();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.02);
    } catch { /* Web Audio unavailable */ }
  }, []);
  const playTick = useCallback(() => playTone(880, 0.12), [playTone]);
  const playEndBeep = useCallback(() => playTone(440, 0.7, 0.22), [playTone]);
  const playNotification = useCallback((double = false) => {
    playTone(660, 0.18, 0.18);
    if (double) setTimeout(() => playTone(660, 0.18, 0.18), 270);
  }, [playTone]);

  const sentenceTotal = sentenceCount(text);
  const openingSentence = firstSentence(text);
  const hasParagraphs = text.trim().split(/\n\s*\n/).filter(Boolean).length >= 2;
  const hasConnectors = /\b(firstly|secondly|however|therefore|moreover|in addition|for example|overall|in conclusion|on the other hand)\b/i.test(text);
  const hasCommonSpellingIssue = hasAnyWord(text, commonMisspellings);
  const checklistItems = isPictureWriting
    ? [
        {
          label: 'Open with a one-line overview',
          done: /\b(picture|photo|image|scene)\b/i.test(openingSentence) && sentenceTotal >= 1,
        },
        {
          label: 'Describe foreground and background',
          done: /\b(foreground|front)\b/i.test(text) && /\b(background|behind|back)\b/i.test(text),
        },
        {
          label: 'Use specific visual vocabulary',
          done: hasAnyWord(text, pictureVocab) || hasAnyWord(text, colorWords),
        },
        {
          label: 'Mention colours or atmosphere',
          done: hasAnyWord(text, colorWords) || hasAnyWord(text, atmosphereWords),
        },
      ]
    : isChartTask
      ? [
          {
            label: 'Write at least 150 words',
            done: wordCount >= minWords,
          },
          {
            label: 'Clear overview sentence',
            done: /\b(overall|in general|it is clear|it can be seen|the main trend)\b/i.test(text),
          },
          {
            label: 'Group and compare key data',
            done: /\b(compared|whereas|while|higher|lower|increase|decrease|rose|fell|largest|smallest|similar|difference)\b/i.test(text),
          },
          {
            label: 'No personal opinion',
            done: text.trim().length > 0 && !/\b(i think|i believe|in my opinion|personally|my view)\b/i.test(text),
          },
        ]
      : [
          {
            label: 'Meet the word target',
            done: wordCount >= minWords,
          },
          {
            label: 'Clear organization',
            done: sentenceTotal >= 3 && (hasParagraphs || hasConnectors),
          },
          {
            label: 'Relevant details',
            done: wordCount >= Math.ceil(minWords * 0.6) && sentenceTotal >= 3,
          },
          {
            label: 'Accurate grammar and vocabulary',
            done: wordCount >= 30 && !hasCommonSpellingIssue,
          },
        ];

  useEffect(() => {
    if (isEvaluating) return;

    const t = setInterval(() => setTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [isEvaluating]);

  useEffect(() => {
    if (isEvaluating) return;
    if (timer === 600) playNotification(false);       // 10-minute warning
    else if (timer === 300) playNotification(true);   // 5-minute warning (double beep)
    else if (timer > 0 && timer <= 10) playTick();
    else if (timer === 0) playEndBeep();
  }, [timer, isEvaluating, playTick, playEndBeep, playNotification]);

  useEffect(() => () => { void audioCtxRef.current?.close(); }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setWordCount(e.target.value.trim().split(/\s+/).filter(Boolean).length);
  };

  const handleSubmit = async () => {
    setIsEvaluating(true);
    try {
      const prompt = isPictureWriting
        ? `${practice.title}\nWrite a picture description paragraph.`
        : practice.title;
      const result = await evaluateWriting(settings, prompt, text, taskKey);
      addHistory({ title: practice.title, type: practice.type, score: result.score, focus: 'Writing' });
      toast.success('Evaluation completed!');
      navigate('/writing/result', { state: { result, originalText: text, practice, exam: activeExam, taskKey } });
    } catch (e) {
      console.error(e);
      toast.error('Failed to evaluate. Please check API key.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="lg:h-[calc(100vh-8rem)] flex flex-col pb-32 md:pb-0 animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium">
          ← Exit
        </button>
        <div className="flex gap-2 items-center">
          <span
            className={cn(
              'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
              activeExam === 'TOEIC'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
            )}
          >
            {activeExam}
          </span>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-sm font-semibold">
            Writing · {taskLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:flex-1 lg:min-h-0">
        <div className={cn('w-full glass-card rounded-3xl p-5 sm:p-6 flex flex-col lg:shrink-0 lg:overflow-y-auto', isChartTask ? 'lg:w-2/5' : 'lg:w-1/3')}>
          <h2 className="text-xl font-bold mb-3 whitespace-pre-line">{practice.title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            {isPictureWriting
              ? 'Write a clear paragraph describing the picture. Include the main scene, important details, and useful vocabulary.'
              : isChartTask
                ? 'Summarise the visual information by selecting and reporting the main features, and make comparisons where relevant.'
                : 'Read the task carefully and write a complete response that directly answers the prompt.'}
          </p>

          {isPictureWriting && (
            <div className="relative rounded-3xl overflow-hidden shadow-lg bg-slate-100 dark:bg-slate-800 mb-4">
              <OptimizedImage
                src={promptImage}
                thumbnailSrc={thumbnailUrl(promptImage)}
                alt={practice.title}
                width={800}
                height={500}
                priority
                fallbackSrc={`https://picsum.photos/seed/${practice.id}/800/500`}
                className="w-full"
              />
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/75 to-transparent">
                <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">Write about</p>
                <p className="text-white text-lg font-semibold leading-snug">{practice.title}</p>
              </div>
            </div>
          )}

          {isChartTask && (
            <div className="mb-4">
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setIsChartExpanded(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-orange-200 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-900/70 dark:hover:text-orange-300"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Enlarge
                </button>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsChartExpanded(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsChartExpanded(true);
                  }
                }}
                className="block w-full rounded-lg text-left transition hover:ring-2 hover:ring-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                aria-label="Enlarge chart"
              >
                <ChartPrompt title={practice.title} />
              </div>
            </div>
          )}

          {isPictureWriting && (
            <div className="rounded-2xl border border-orange-100 dark:border-orange-900/40 bg-orange-50/60 dark:bg-orange-900/10 p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" /> Try to use
                </h3>
                <span className="text-xs text-slate-400 font-medium">vocab guide</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pictureVocab.map((word) => (
                  <span key={word} className="px-2.5 py-1 rounded-full text-sm font-medium border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          <h3 className="font-bold mb-3">Checklist</h3>
          <ul className="space-y-3 mb-6">
            {checklistItems.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                {item.done ? <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />}
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 glass-card rounded-3xl overflow-hidden flex flex-col relative border border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="h-14 border-b border-[var(--border)] px-6 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50">
            <span className={cn('flex items-center gap-1.5 text-sm font-semibold', wordCount >= minWords ? 'text-green-600 dark:text-green-400' : 'text-slate-500')}>
              <Type className="w-4 h-4" /> {wordCount} / {minWords} words
            </span>
            <div className={cn(
              'flex items-center gap-2 text-sm font-bold transition-colors duration-300',
              timer <= 10
                ? 'text-red-500'
                : timer <= 300
                  ? 'text-orange-500'
                  : timer <= 600
                    ? 'text-amber-500'
                    : 'text-slate-500 dark:text-slate-400',
            )}>
              <Clock className={cn('w-4 h-4', timer <= 300 && timer > 10 && 'animate-pulse', timer <= 10 && 'animate-pulse')} />
              <span key={timer <= 10 ? timer : 'calm'} className={cn(timer > 0 && timer <= 10 && 'animate-timer-shake')}>
                {formatTime(timer)}
              </span>
            </div>
          </div>

          <textarea
            className="flex-1 min-h-[42vh] lg:min-h-0 w-full bg-transparent p-5 sm:p-6 resize-none outline-none text-base sm:text-lg leading-relaxed text-[var(--foreground)] placeholder:text-slate-400"
            placeholder={isPictureWriting ? 'In the picture, I can see...' : isChartTask ? 'The chart illustrates...' : 'Write your response here...'}
            value={text}
            onChange={handleChange}
            autoFocus
            spellCheck={false}
          />

          <div className="hidden md:flex p-4 border-t border-[var(--border)] bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur shrink-0 items-center justify-between gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI examiner ready
            </span>
            <button
              onClick={handleSubmit}
              disabled={wordCount < 10 || isEvaluating}
              className={cn(
                'flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-md transition-all',
                wordCount >= 10 && !isEvaluating
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              )}
            >
              {isEvaluating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin" /> Evaluating...
                </>
              ) : (
                <>
                  {activeExam === 'IELTS' ? 'Submit for Band' : 'Submit for Score'} <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed inset-x-0 bottom-[78px] z-30 px-4 pt-4 pb-2 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent">
        <button
          onClick={handleSubmit}
          disabled={wordCount < 10 || isEvaluating}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold shadow-lg transition-all',
            wordCount >= 10 && !isEvaluating
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          )}
        >
          {isEvaluating ? (
            <>
              <div className="w-4 h-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin" /> Evaluating...
            </>
          ) : (
            <>
              {activeExam === 'IELTS' ? 'Submit for Band' : 'Submit for Score'} <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {isChartTask && isChartExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded chart"
          onClick={() => setIsChartExpanded(false)}
        >
          <div
            className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-end border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsChartExpanded(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                aria-label="Close expanded chart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[82vh] overflow-auto bg-slate-100 p-3 sm:p-6 dark:bg-slate-900">
              <div className="mx-auto w-full min-w-[640px] max-w-4xl">
                <ChartPrompt title={practice.title} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingEditor;
