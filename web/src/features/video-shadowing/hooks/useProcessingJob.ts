// Drives the local "generate script" pipeline for a lesson with progress /
// cancel / retry. Steps: extract audio (ffmpeg) → transcribe (Whisper) →
// segment. ffmpeg/transcription are stubbed this iteration, so the job surfaces
// a friendly, retryable error — the full progress/cancel/error UI is real.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ffmpegService } from '../services/media-processing/ffmpegService';
import { transcriptionService } from '../services/transcription/transcriptionService';
import { segmentTranscript } from '../utils/transcriptSegmenter';
import { lessonRepo, segmentRepo } from '../services/storage/videoShadowingRepository';
import { fileStorage } from '../services/storage/opfsFileStorage';
import { toFriendlyError, VideoShadowingError } from '../utils/errorCodes';
import type { ProcessingStep } from '../models/processingJob';
import type { VideoShadowingLesson } from '../models/lesson';

const STEP_DEFS: { key: string; label: string }[] = [
  { key: 'extract', label: 'Extracting audio locally' },
  { key: 'model', label: 'Loading speech recognition model' },
  { key: 'transcribe', label: 'Generating script locally' },
  { key: 'segment', label: 'Splitting script into practice segments' },
  { key: 'ready', label: 'Ready to review' },
];

type JobStatus = 'idle' | 'running' | 'failed' | 'done';

export function useProcessingJob(lessonId: string) {
  const [status, setStatus] = useState<JobStatus>('idle');
  const [steps, setSteps] = useState<ProcessingStep[]>(STEP_DEFS.map((s) => ({ ...s, state: 'idle' })));
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const setStepState = (key: string, state: ProcessingStep['state']) =>
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, state } : s)));

  const run = useCallback(async () => {
    setStatus('running');
    setError(null);
    setProgress(0);
    setSteps(STEP_DEFS.map((s) => ({ ...s, state: 'idle' })));
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const lesson = (await lessonRepo.get(lessonId)) as VideoShadowingLesson | undefined;
      if (!lesson?.localVideoFileId) throw new VideoShadowingError('VIDEO_READ_FAILED');

      const videoBlob = await fileStorage.get(lesson.localVideoFileId);
      if (!videoBlob) throw new VideoShadowingError('VIDEO_READ_FAILED');

      // 1. Extract + normalize audio (mono / 16 kHz).
      setStepState('extract', 'active');
      await ffmpegService.load((r) => setProgress(Math.round(r * 20)));
      const audio = await ffmpegService.extractAudio(videoBlob, { sampleRate: 16000, channels: 1 }, (r) => setProgress(20 + Math.round(r * 20)), ac.signal);
      setStepState('extract', 'done');

      // 2 + 3. Load model + transcribe.
      setStepState('model', 'active');
      await transcriptionService.initialize();
      setStepState('model', 'done');
      setStepState('transcribe', 'active');
      const audioBuffer = await audio.arrayBuffer();
      const result = await transcriptionService.transcribe(audioBuffer, { sampleRate: 16000 }, (p) => setProgress(40 + Math.round(p.progress * 0.5)), ac.signal);
      setStepState('transcribe', 'done');

      // 4. Segment.
      setStepState('segment', 'active');
      const segments = segmentTranscript(result.chunks, lesson.segmentMode, lessonId);
      await segmentRepo.replaceForLesson(lessonId, segments);
      setStepState('segment', 'done');

      // 5. Done.
      setStepState('ready', 'done');
      setProgress(100);
      await lessonRepo.save({ ...lesson, status: 'Ready', processingProgress: 100, transcriptSource: 'LocalTranscription' });
      setStatus('done');
    } catch (err) {
      setSteps((prev) => prev.map((s) => (s.state === 'active' ? { ...s, state: 'failed' } : s)));
      setError(toFriendlyError(err).message);
      setStatus('failed');
    }
  }, [lessonId]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { status, steps, progress, error, run, cancel };
}
