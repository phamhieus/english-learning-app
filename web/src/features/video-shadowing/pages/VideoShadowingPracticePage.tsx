import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Film, Repeat, EyeOff, Eye, Square, Mic,
  RotateCcw, ArrowRight, SkipBack, SkipForward, Play, Captions,
  GitCompare, CheckCircle, Info, Loader2, Volume2,
  Maximize2, Minimize2,
} from 'lucide-react';
import { cn } from '../../../components/classNames';
import { useToast } from '../../../components/useToast';
import { VideoThumb, Waveform, WAVE, ScorePill } from '../components/primitives';
import { useVideoShadowingSession } from '../hooks/useVideoShadowingSession';
import { useVideoSegmentPlayer, type PlaybackRate } from '../hooks/useVideoSegmentPlayer';
import { useVideoSource } from '../hooks/useVideoSource';
import { useYouTubeSegmentPlayer } from '../hooks/useYouTubeSegmentPlayer';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useLiveTranscript } from '../hooks/useLiveTranscript';
import { VoiceReaderToggle } from '../../voice-reader/VoiceReaderControls';
import { useVoiceReader } from '../../voice-reader/useVoiceReader';
import { parseYouTubeId } from '../utils/youtube';
import { fileStorage } from '../services/storage/opfsFileStorage';
import { getBuiltInVoaLesson } from '../services/video-source/builtInVoaResolver';
import { transcriptionService } from '../services/transcription/transcriptionService';
import { formatClock } from '../utils/timestampUtils';
import type { VideoShadowingAttempt } from '../models/session';

const RATES: PlaybackRate[] = [0.75, 1, 1.25];

export default function VideoShadowingPracticePage() {
  const { lessonId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { lesson, segments, attempts, loading, activeIndex, setActiveIndex, saveAttempt, completeSession } =
    useVideoShadowingSession(lessonId);

  const [loop, setLoop] = useState(false);
  const [rate, setRate] = useState<PlaybackRate>(1);
  const [showScript, setShowScript] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [scoring, setScoring] = useState(false);
  const [scoringMsg, setScoringMsg] = useState('Scoring...');
  const userAudioRef = useRef<HTMLAudioElement | null>(null);
  const fullscreenHostRef = useRef<HTMLDivElement | null>(null);
  const [dismissedSegmentIds, setDismissedSegmentIds] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const active = segments[activeIndex] ?? null;
  const grad = getBuiltInVoaLesson(lessonId)?.grad ?? 'amber';

  const isYouTube = lesson?.sourceType === 'YouTube';
  const ytId = isYouTube ? lesson?.providerItemId ?? parseYouTubeId(lesson?.sourceUrl ?? '') : null;

  const htmlPlayer = useVideoSegmentPlayer({
    segments,
    activeSegmentId: active?.id ?? null,
    loopEnabled: loop,
    playbackRate: rate,
  });
  const ytPlayer = useYouTubeSegmentPlayer({
    videoId: ytId,
    segments,
    activeSegmentId: active?.id ?? null,
    loopEnabled: loop,
    playbackRate: rate,
  });

  const { videoRef } = htmlPlayer;
  // Source attachment (mp4 vs HLS) is separate from playback control; compose
  // both callback refs onto the same <video> element.
  const sourceRef = useVideoSource(isYouTube ? null : videoUrl);
  const setVideoEl = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef(node);
      sourceRef(node);
    },
    [videoRef, sourceRef],
  );
  const { containerRef: ytContainerRef } = ytPlayer;
  const { isPlaying, currentTimeMs, durationMs, playSegment, playAll, seekToSegment, pause } = isYouTube
    ? ytPlayer
    : htmlPlayer;

  const recorder = useAudioRecorder();
  const voiceReader = useVoiceReader({ exerciseId: `video-shadowing-${lessonId}` });
  const live = useLiveTranscript();

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === fullscreenHostRef.current);
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  // Resolve a playable URL for user uploads / direct links (VOA has none yet).
  useEffect(() => {
    let url: string | null = null;
    let revoke = false;
    (async () => {
      if (!lesson) return;
      if (lesson.sourceType === 'YouTube') {
        setVideoUrl(null); // handled by the YouTube IFrame player
        return;
      }
      if (lesson.localVideoFileId) {
        url = (await fileStorage.getObjectUrl(lesson.localVideoFileId)) ?? null;
        revoke = true;
      } else {
        // Curated built-ins carry their direct media URL on the manifest entry;
        // prefer it over `sourceUrl` (which on a built-in is the attribution
        // page, not a playable file). DirectUrl uploads fall back to sourceUrl.
        url = getBuiltInVoaLesson(lessonId)?.videoUrl ?? lesson.sourceUrl ?? null;
      }
      setVideoUrl(url);
    })();
    return () => {
      if (url && revoke) URL.revokeObjectURL(url);
    };
  }, [lesson, lessonId]);

  const doneCount = useMemo(
    () => new Set(attempts.filter((a) => !dismissedSegmentIds.has(a.segmentId)).map((a) => a.segmentId)).size,
    [attempts, dismissedSegmentIds],
  );

  // Latest attempt for the active segment drives the quick-feedback card.
  const activeAttempt = useMemo(
    () => (active && !dismissedSegmentIds.has(active.id) ? [...attempts].reverse().find((a) => a.segmentId === active.id) : undefined),
    [attempts, active, dismissedSegmentIds],
  );

  // When a recording finishes: transcribe it locally (Whisper), then score +
  // persist. Audio is always saved even if transcription fails. First run may
  // download the model (~40 MB), cached afterwards.
  useEffect(() => {
    if (recorder.status !== 'stopped' || !recorder.audioBlob || !active) return;
    const blob = recorder.audioBlob;
    const seg = active;
    const durationMs = recorder.durationMs;
    let cancelled = false;

    (async () => {
      setScoring(true);
      let recognizedText = '';
      try {
        const buf = await blob.arrayBuffer();
        const result = await transcriptionService.transcribe(
          buf,
          { sampleRate: 16000, returnTimestamps: false },
          (p) => {
            if (cancelled) return;
            setScoringMsg(p.phase === 'loading_model' ? `Loading model... ${p.progress}%` : 'Scoring...');
          },
        );
        recognizedText = result.text;
      } catch {
        // Scoring is optional — keep the recording regardless.
      }
      try {
        await saveAttempt({ segment: seg, audioBlob: blob, audioDurationMs: durationMs, recognizedText });
        setDismissedSegmentIds((prev) => {
          const next = new Set(prev);
          next.delete(seg.id);
          return next;
        });
      } catch {
        if (!cancelled) toast.error('Failed to save the recording.');
      }
      if (!cancelled) setScoring(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.status]);

  // While playing the whole video (loop off), highlight the segment under the
  // playhead — syncs the script/timeline to the video position. Falls back to
  // the first/most-recent segment so the lead-in and inter-segment gaps still
  // show a script (otherwise the start of the video has nothing highlighted).
  useEffect(() => {
    if (!isPlaying || loop || segments.length === 0) return;
    let idx = segments.findIndex((s) => currentTimeMs >= s.startMs && currentTimeMs < s.endMs);
    if (idx === -1) {
      if (currentTimeMs < segments[0].startMs) {
        idx = 0; // before the first segment starts
      } else {
        for (let i = segments.length - 1; i >= 0; i--) {
          if (currentTimeMs >= segments[i].startMs) {
            idx = i;
            break;
          }
        }
      }
    }
    if (idx >= 0 && idx !== activeIndex) setActiveIndex(idx);
  }, [currentTimeMs, isPlaying, loop, segments, activeIndex, setActiveIndex]);

  if (loading) return <div className="glass-card rounded-3xl py-16 text-center text-slate-400">Loading practice session...</div>;
  if (!lesson || !active) return <div className="glass-card rounded-3xl py-16 text-center text-slate-400">Practice session not found.</div>;

  const goto = (i: number) => {
    pause();
    voiceReader.stop();
    live.stop();
    live.reset();
    recorder.reset();
    const next = Math.max(0, Math.min(segments.length - 1, i));
    setActiveIndex(next);
    if (segments[next]) seekToSegment(segments[next].id);
  };

  const listen = () => {
    pause();
    if (voiceReader.status === 'playing' || voiceReader.status === 'loading') voiceReader.stop();
    else voiceReader.speakSegments([{ id: active.id, text: active.text }], { mode: 'shadowing' });
  };

  const startRecording = () => {
    pause();
    voiceReader.stop();
    if (active) {
      setDismissedSegmentIds((prev) => {
        const next = new Set(prev);
        next.add(active.id);
        return next;
      });
    }
    live.start();
    recorder.startRecording();
  };

  const handleRetryClick = () => {
    recorder.reset();
    if (active) {
      setDismissedSegmentIds((prev) => {
        const next = new Set(prev);
        next.add(active.id);
        return next;
      });
    }
  };

  const stopRecording = () => {
    live.stop();
    recorder.stopRecording();
  };

  const canPlay = isYouTube ? !!ytId : !!videoUrl;
  const toggleFullscreen = async () => {
    const host = fullscreenHostRef.current;
    if (!host) return;
    try {
      if (document.fullscreenElement === host) {
        await document.exitFullscreen();
      } else {
        await host.requestFullscreen();
      }
    } catch {
      toast.info('Fullscreen is unavailable in this browser.');
    }
  };

  const togglePlay = () => {
    if (!canPlay) {
      toast.info(isYouTube ? 'YouTube video is not ready, please try again in a moment.' : 'This lesson video is unavailable right now. Please try again or pick another lesson.');
      return;
    }
    if (isPlaying) pause();
    else if (loop) playSegment(active.id);
    else playAll();
  };

  const playMyRecording = () => {
    if (recorder.blobUrl) userAudioRef.current?.play();
    else toast.info('No recording available to compare.');
  };

  const finish = async () => {
    await completeSession();
    navigate(`/video-shadowing/lessons/${lessonId}/result`);
  };

  // Scrubber position + per-segment ticks.
  const progressPct = durationMs > 0 ? Math.min(100, (currentTimeMs / durationMs) * 100) : 0;
  const ticks = durationMs > 0 ? segments.map((s) => (s.startMs / durationMs) * 100) : [];
  const hasScore = !!activeAttempt && !!activeAttempt.recognizedText;

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-6.5rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 shrink-0 gap-3 flex-wrap">
        <button onClick={() => navigate('/video-shadowing')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium">
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-lg">{lesson.title}</h2>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400"><Film className="w-4 h-4" /> Segment {activeIndex + 1} / {segments.length}</div>
      </div>

      {/* Hero video — single, centered. Full-width up to tablet; on desktop it
          flexes to fill the remaining height so the whole screen fits without
          scrolling (the page itself gets a definite height above). */}
      <div className="lg:flex-1 lg:min-h-0 flex items-center justify-center mb-3">
        <div
          ref={fullscreenHostRef}
          className={cn(
            'group relative overflow-hidden bg-black transition-all',
            isFullscreen
              ? 'w-screen h-screen rounded-none shadow-none'
              : 'w-full lg:w-auto lg:h-full aspect-video lg:max-w-full rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/40',
          )}
        >
          {isYouTube ? (
            // Official YouTube IFrame embed (the API replaces this div with an iframe).
            <div className="absolute inset-0 w-full h-full">
              <div ref={ytContainerRef} className="w-full h-full" />
            </div>
          ) : (
            <>
              {/* Always mount the <video> so the player hook can attach its
                  listeners; overlay the placeholder until a URL resolves. */}
              <video
                ref={setVideoEl}
                className={cn('w-full h-full', isFullscreen ? 'object-cover' : 'object-contain', !videoUrl && 'invisible')}
                playsInline
                muted={false}
                preload="metadata"
                onError={() => videoUrl && toast.error('Failed to load video. The source might be unavailable.')}
              />
              {!videoUrl && (
                <div className="absolute inset-0">
                  <VideoThumb grad={grad} source={lesson.sourceType === 'BuiltInVoa' ? 'VOA' : 'Upload'} rounded="rounded-3xl" big />
                </div>
              )}
            </>
          )}

          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />

          {isFullscreen ? (
            <div className="absolute top-0 inset-x-0 z-20 flex items-start justify-between gap-4 px-6 sm:px-8 pt-5">
              <div className="flex items-center gap-4 min-w-0">
                <button onClick={toggleFullscreen} className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg" title="Exit fullscreen">
                  <Minimize2 className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-white font-bold text-lg sm:text-xl leading-tight truncate">{lesson.title}</h2>
                  <p className="text-white/70 text-xs sm:text-sm font-medium mt-0.5">Segment {activeIndex + 1} of {segments.length}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-black/45 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300" /> Now: segment {activeIndex + 1}
            </div>
          )}

          <div className={cn('absolute z-20 flex items-center gap-2', isFullscreen ? 'top-5 right-6 sm:right-8' : 'top-4 right-4')}>
            <div className="flex items-center gap-1 p-1 bg-white/15 backdrop-blur-md rounded-lg">
              {RATES.map((r) => (
                <button key={r} onClick={() => setRate(r)} className={cn('px-2.5 py-1 rounded-md text-xs font-bold transition', r === rate ? 'bg-white text-indigo-600' : 'text-white/80 hover:text-white')}>{r}x</button>
              ))}
            </div>
            <button onClick={() => setLoop((v) => !v)} className={cn('px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5', loop ? 'bg-indigo-500 text-white' : 'bg-white/15 text-white')}>
              <Repeat className="w-3.5 h-3.5" /> Loop
            </button>
          </div>

          {showScript && (
            <div
              className={cn(
                'absolute inset-x-0 flex flex-col items-center justify-center px-6 z-10 pointer-events-none',
                isFullscreen ? 'bottom-48 sm:bottom-52 gap-3' : isYouTube ? 'bottom-20' : 'bottom-16',
              )}
            >
              {isFullscreen && <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white/80 text-[11px] font-bold uppercase tracking-widest">Repeat after the speaker</span>}
              <span className={cn('px-4 py-2 rounded-xl bg-black/55 backdrop-blur-md text-white font-semibold text-center', isFullscreen ? 'max-w-5xl text-2xl sm:text-4xl leading-tight' : 'text-lg')}>{active.text}</span>
              {isFullscreen && active.translation && <span className="text-white/70 text-base sm:text-lg font-medium italic text-center">{active.translation}</span>}
            </div>
          )}

          {/* Custom scrubber (HTML5 video only — YouTube has its own controls). */}
          {!isYouTube && (
            <div className={cn('absolute inset-x-0 p-4 z-10 pointer-events-none', isFullscreen ? 'bottom-28 px-6 sm:px-8' : 'bottom-0 bg-gradient-to-t from-black/60 to-transparent')}>
              <div className="relative h-1.5 rounded-full bg-white/30">
                <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${progressPct}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow" style={{ left: `${progressPct}%` }} />
                {ticks.map((p, i) => <span key={i} className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/50" style={{ left: `${p}%` }} />)}
              </div>
              <div className="flex items-center justify-between mt-2 text-white text-xs font-mono"><span>{formatClock(currentTimeMs)}</span><span>{formatClock(durationMs || lesson.durationMs)}</span></div>
            </div>
          )}

          {!isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="absolute bottom-4 right-4 z-30 w-10 h-10 rounded-lg bg-black/55 hover:bg-black/75 backdrop-blur-md border border-white/15 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shadow-lg"
              title="Fullscreen"
              aria-label="Fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          )}

          {isFullscreen && (
            <FullscreenPracticeDock
              activeIndex={activeIndex}
              segmentCount={segments.length}
              isPlaying={isPlaying}
              recorderStatus={recorder.status}
              recorderDurationMs={recorder.durationMs}
              scoring={scoring}
              scoringMsg={scoringMsg}
              activeAttempt={activeAttempt}
              showScript={showScript}
              onTogglePlay={togglePlay}
              onPrev={() => goto(activeIndex - 1)}
              onNext={() => goto(activeIndex + 1)}
              onToggleScript={() => setShowScript((v) => !v)}
              onToggleFullscreen={toggleFullscreen}
              onRecord={startRecording}
              onStopRecord={stopRecording}
              onRetry={handleRetryClick}
              onContinue={activeIndex >= segments.length - 1 ? finish : () => goto(activeIndex + 1)}
            />
          )}
        </div>
      </div>

      {/* Playback controls row */}
      <div className="shrink-0 flex items-center justify-center gap-3 mb-4 flex-wrap py-2 px-3">
        <button onClick={() => goto(activeIndex - 1)} disabled={activeIndex === 0} className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm disabled:opacity-40"><SkipBack className="w-5 h-5" /></button>
        <button onClick={togglePlay} className={cn('w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg transition', isPlaying ? 'bg-red-500 shadow-red-500/30' : 'bg-indigo-600 shadow-indigo-500/30')}>
          {isPlaying ? <Square className="w-6 h-6" style={{ fill: 'currentColor' }} /> : <Play className="w-7 h-7" style={{ fill: 'currentColor', marginLeft: 2 }} />}
        </button>
        <button onClick={() => goto(activeIndex + 1)} disabled={activeIndex >= segments.length - 1} className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-sm disabled:opacity-40"><SkipForward className="w-5 h-5" /></button>
        <button onClick={() => playSegment(active.id)} className="ml-1 h-11 px-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium flex items-center gap-2"><Captions className="w-4 h-4" /> Play Original</button>
        {voiceReader.supported && (
          <button
            onClick={listen}
            disabled={!voiceReader.canPlayAudio}
            className={cn(
              'h-11 px-4 rounded-full border text-sm font-medium flex items-center gap-2 transition',
              voiceReader.status === 'playing' || voiceReader.status === 'loading'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
              !voiceReader.canPlayAudio && 'opacity-40 cursor-not-allowed'
            )}
          >
            <Volume2 className="w-4 h-4" /> {voiceReader.status === 'playing' || voiceReader.status === 'loading' ? 'Stop' : 'Listen'}
          </button>
        )}
        <VoiceReaderToggle
          supported={voiceReader.supported}
          globallyEnabled={voiceReader.globalVoiceReaderEnabled}
          muted={voiceReader.isTemporarilyMuted}
          onChange={voiceReader.setTemporarilyMuted}
        />
        <button onClick={() => setShowScript((v) => !v)} className="h-11 px-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium flex items-center gap-2">
          {showScript ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {showScript ? 'Hide script' : 'Show script'}
        </button>
        <button onClick={toggleFullscreen} className="h-11 px-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium flex items-center gap-2" title="Fullscreen">
          <Maximize2 className="w-4 h-4" /> Fullscreen
        </button>
      </div>

      {/* Practice strip — record (left) + quick feedback (right). */}
      <div className="shrink-0 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-5">
        {/* Record + script */}
        <div className="glass-card rounded-2xl p-4 flex flex-col">
          <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">Repeat after the speaker</p>
          <p
            className={cn(
              'text-xl font-bold leading-tight py-2 rounded-xl transition-colors',
              voiceReader.activeSegmentId === active.id && 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 px-3'
            )}
          >
            {active.text}
          </p>
          {active.translation && <p className="text-sm text-slate-500 italic mb-4">{active.translation}</p>}

          <div className="mt-auto rounded-2xl bg-indigo-50/60 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-4 flex items-center gap-4">
            {recorder.status === 'recording' ? (
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="relative inline-flex"><span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" /><span className="relative w-2.5 h-2.5 rounded-full bg-red-500" /></span>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">{formatClock(recorder.durationMs)}</span>
                  </div>
                  <div className="flex-1 h-10 flex items-center"><Waveform heights={WAVE} color="bg-indigo-500/80" /></div>
                  <button onClick={stopRecording} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md shadow-red-500/25 shrink-0"><Square className="w-4 h-4" style={{ fill: 'currentColor' }} /> Stop</button>
                </div>
                {live.supported && (
                  <div className="rounded-xl bg-white/60 dark:bg-slate-900/40 border border-indigo-100 dark:border-indigo-500/20 px-3 py-2 min-h-[2.5rem]">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-0.5">Live transcript</p>
                    <p className="text-sm leading-snug">
                      <span className="text-slate-700 dark:text-slate-200">{live.transcript}</span>{' '}
                      <span className="text-slate-400 italic">{live.interim}</span>
                      {!live.transcript && !live.interim && <span className="text-slate-400">Listening...</span>}
                    </p>
                  </div>
                )}
              </div>
            ) : recorder.blobUrl ? (
              <>
                <audio ref={userAudioRef} src={recorder.blobUrl} className="hidden" />
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide shrink-0">Your take</span>
                <audio src={recorder.blobUrl} controls className="flex-1 h-9 min-w-0" />
                <button onClick={startRecording} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md shadow-indigo-500/25 shrink-0"><Mic className="w-4 h-4" /> Re-record</button>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 text-indigo-500 shrink-0" />
                <p className="flex-1 text-sm text-slate-500 dark:text-slate-400">Click to record your reading</p>
                <button onClick={startRecording} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md shadow-indigo-500/25 shrink-0"><Mic className="w-4 h-4" /> Record</button>
              </>
            )}
          </div>
          {recorder.error && <p className="text-[11px] text-red-500 mt-2">{recorder.error}</p>}
        </div>

        {/* Quick feedback */}
        <div className="glass-card rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick feedback</p>
            {hasScore && activeAttempt && <RatingChip score={activeAttempt.totalScore ?? 0} />}
          </div>

          {scoring ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-3">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400">{scoringMsg}</p>
            </div>
          ) : hasScore && activeAttempt ? (
            <QuickFeedbackBody attempt={activeAttempt} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-3">
              <Info className="w-5 h-5 text-indigo-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[18rem]">
                {recorder.blobUrl
                  ? 'Recording saved. No speech recognized — you can still listen and try again.'
                  : 'Record this segment to get instant feedback on pronunciation, fluency, and rhythm.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-auto pt-3">
            <button onClick={handleRetryClick} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"><RotateCcw className="w-4 h-4" /> Retry</button>
            <button onClick={playMyRecording} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"><GitCompare className="w-4 h-4" /> Compare</button>
            {activeIndex >= segments.length - 1 ? (
              <button onClick={finish} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 text-white text-xs font-semibold shadow-md shadow-green-500/25">Finish <ArrowRight className="w-4 h-4" /></button>
            ) : (
              <button onClick={() => goto(activeIndex + 1)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/25">Next <ArrowRight className="w-4 h-4" /></button>
            )}
          </div>
        </div>
      </div>

      {/* Segment timeline */}
      <div className="shrink-0 mt-3 pt-3 border-t border-[var(--border)]">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session timeline</p>
          <span className="text-[11px] font-bold text-indigo-500">{doneCount}/{segments.length} recorded</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {segments.map((s, i) => {
            const recorded = attempts.some((a) => a.segmentId === s.id) && !dismissedSegmentIds.has(s.id);
            const current = i === activeIndex;
            return (
              <button
                key={s.id}
                onClick={() => goto(i)}
                className={cn(
                  'shrink-0 max-w-[160px] flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition',
                  current ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/30'
                    : recorded ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30'
                    : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', current ? 'bg-white' : recorded ? 'bg-green-500' : 'bg-slate-300')} />
                <span className="truncate">{i + 1}. {s.text || '—'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FullscreenPracticeDock({
  activeIndex,
  segmentCount,
  isPlaying,
  recorderStatus,
  recorderDurationMs,
  scoring,
  scoringMsg,
  activeAttempt,
  showScript,
  onTogglePlay,
  onPrev,
  onNext,
  onToggleScript,
  onToggleFullscreen,
  onRecord,
  onStopRecord,
  onRetry,
  onContinue,
}: {
  activeIndex: number;
  segmentCount: number;
  isPlaying: boolean;
  recorderStatus: string;
  recorderDurationMs: number;
  scoring: boolean;
  scoringMsg: string;
  activeAttempt?: VideoShadowingAttempt;
  showScript: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleScript: () => void;
  onToggleFullscreen: () => void;
  onRecord: () => void;
  onStopRecord: () => void;
  onRetry: () => void;
  onContinue: () => void | Promise<void>;
}) {
  const recording = recorderStatus === 'recording';
  const hasScore = !!activeAttempt && !!activeAttempt.recognizedText;
  const ctrlBtn = 'rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition shadow-lg disabled:opacity-40 disabled:hover:bg-white/15';

  return (
    <>
      {(scoring || hasScore) && (
        <div className="absolute right-4 sm:right-8 bottom-36 z-30 w-[min(21rem,calc(100vw-2rem))] rounded-2xl bg-black/55 backdrop-blur-xl border border-white/15 p-5 shadow-2xl">
          {scoring ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-300 animate-spin shrink-0" />
              <div>
                <p className="text-white text-sm font-bold">Scoring your take</p>
                <p className="text-white/60 text-xs mt-0.5">{scoringMsg}</p>
              </div>
            </div>
          ) : activeAttempt ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-[11px] font-bold uppercase tracking-widest">Your take · scored</span>
                <RatingChip score={activeAttempt.totalScore ?? 0} />
              </div>
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <span className="text-white text-5xl font-bold leading-none">{Math.round(activeAttempt.totalScore ?? 0)}</span>
                  <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wide mt-1">Overall</p>
                </div>
                <div className="flex-1 grid gap-2">
                  {[
                    ['Pron.', activeAttempt.pronunciationScore ?? 0, 'bg-green-400'],
                    ['Fluency', activeAttempt.fluencyScore ?? 0, 'bg-indigo-400'],
                    ['Rhythm', activeAttempt.rhythmScore ?? 0, 'bg-orange-400'],
                  ].map(([label, value, color]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-white/70 text-[11px] font-semibold w-14 shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/15 overflow-hidden">
                        <div className={cn('h-full rounded-full', color)} style={{ width: `${value}%` }} />
                      </div>
                      <span className="text-white text-xs font-bold w-6 text-right">{Math.round(Number(value))}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-white/75 leading-relaxed mb-4">
                {activeAttempt.feedback || 'Recording saved. Try to keep the same rhythm as the speaker.'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={onRetry} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold transition">
                  <RotateCcw className="w-4 h-4" /> Retry
                </button>
                <button onClick={onContinue} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-lg shadow-indigo-500/30">
                  {activeIndex >= segmentCount - 1 ? 'Finish' : 'Next'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 z-20 px-4 sm:px-8 pb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onPrev} disabled={activeIndex === 0} className={cn(ctrlBtn, 'w-11 h-11')} title="Previous segment">
              <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={onTogglePlay} className={cn(ctrlBtn, 'w-14 h-14')} title="Play / pause">
              {isPlaying ? <Square className="w-6 h-6" style={{ fill: 'currentColor' }} /> : <Play className="w-7 h-7" style={{ fill: 'currentColor', marginLeft: 2 }} />}
            </button>
            <button onClick={onNext} disabled={activeIndex >= segmentCount - 1} className={cn(ctrlBtn, 'w-11 h-11')} title="Next segment">
              <SkipForward className="w-5 h-5" />
            </button>
            <button onClick={onToggleScript} className={cn(ctrlBtn, 'h-11 px-4 gap-2 text-sm font-medium', !showScript && 'opacity-70')} title="Toggle subtitles">
              <Captions className="w-4 h-4" /> Subtitles
            </button>
            <button onClick={onToggleFullscreen} className={cn(ctrlBtn, 'w-11 h-11')} title="Exit fullscreen">
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className={cn('items-center gap-3 h-12 px-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 transition-all duration-200', recording ? 'hidden sm:flex opacity-100' : 'hidden opacity-0')}>
              <span className="flex items-center gap-1.5 text-red-300 text-xs font-bold uppercase tracking-wide shrink-0">
                <span className="relative inline-flex"><span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" /><span className="relative w-2 h-2 rounded-full bg-red-500" /></span>
                Rec
              </span>
              <Waveform heights={WAVE} color="bg-white/80" />
              <span className="text-white/80 text-xs font-mono shrink-0">{formatClock(recorderDurationMs)}</span>
            </div>

            <button
              onClick={recording ? onStopRecord : onRecord}
              title={recording ? 'Stop and score' : 'Record'}
              className={cn(
                'relative w-[72px] h-[72px] rounded-full flex items-center justify-center text-white font-bold shadow-2xl transition-all duration-200 border-4 border-white/30',
                recording ? 'bg-red-500 shadow-red-500/40' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/40',
              )}
            >
              {recording && <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />}
              {recording ? <Square className="relative w-7 h-7" style={{ fill: 'currentColor' }} /> : <Mic className="w-8 h-8" />}
            </button>
            <div className="hidden sm:block w-[120px]">
              <p className="text-white text-sm font-bold leading-tight">{recording ? 'Tap to stop' : hasScore ? 'Recorded' : 'Tap to speak'}</p>
              <p className="text-white/60 text-xs">{recording ? 'Listening...' : 'Mic ready'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RatingChip({ score }: { score: number }) {
  const good = score >= 85;
  const ok = score >= 70;
  return (
    <span className={cn('text-xs font-bold flex items-center gap-1', good ? 'text-green-600' : ok ? 'text-orange-600' : 'text-red-500')}>
      <CheckCircle className="w-3.5 h-3.5" /> {good ? 'Good' : ok ? 'OK' : 'Retry'}
    </span>
  );
}

function QuickFeedbackBody({ attempt }: { attempt: VideoShadowingAttempt }) {
  return (
    <>
      <div className="flex gap-3 mb-3">
        <ScorePill label="Pron." value={attempt.pronunciationScore ?? 0} color="bg-green-500" />
        <ScorePill label="Fluency" value={attempt.fluencyScore ?? 0} color="bg-indigo-500" />
        <ScorePill label="Rhythm" value={attempt.rhythmScore ?? 0} color="bg-orange-500" />
      </div>
      <div className="flex flex-col gap-1.5 text-xs">
        {attempt.mispronouncedWords.length > 0 && (
          <div className="flex items-start gap-2"><span className="text-orange-500 font-bold shrink-0 mt-0.5">Mispron.</span><span className="text-slate-600 dark:text-slate-300">{attempt.mispronouncedWords.slice(0, 4).join(', ')}</span></div>
        )}
        {attempt.missingWords.length > 0 && (
          <div className="flex items-start gap-2"><span className="text-red-500 font-bold shrink-0 mt-0.5">Missing</span><span className="text-slate-600 dark:text-slate-300">{attempt.missingWords.slice(0, 4).join(', ')}</span></div>
        )}
        {attempt.feedback && <p className="text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{attempt.feedback}</p>}
      </div>
    </>
  );
}
