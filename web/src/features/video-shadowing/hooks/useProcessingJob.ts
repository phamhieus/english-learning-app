// Drives the local "generate script" pipeline for a lesson with progress /
// cancel / retry. Steps: extract audio (ffmpeg) → transcribe (Whisper) →
// segment. ffmpeg/transcription are stubbed this iteration, so the job surfaces
// a friendly, retryable error — the full progress/cancel/error UI is real.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ffmpegService } from '../services/media-processing/ffmpegService';
import { transcriptionService } from '../services/transcription/transcriptionService';
import { downloadDirectMedia } from '../services/video-source/directUrlResolver';
import { segmentTranscript } from '../utils/transcriptSegmenter';
import { lessonRepo, segmentRepo } from '../services/storage/videoShadowingRepository';
import { fileStorage, filePaths } from '../services/storage/opfsFileStorage';
import { toFriendlyError, VideoShadowingError } from '../utils/errorCodes';
import type { ProcessingStep } from '../models/processingJob';
import type { VideoShadowingLesson } from '../models/lesson';

const STEP_DEFS: { key: string; label: string }[] = [
  { key: 'download', label: 'Loading video' },
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
      if (!lesson) throw new VideoShadowingError('VIDEO_READ_FAILED');

      // 0. Resolve the video Blob — already local (upload) or download it now
      //    (direct URL). YouTube can't be processed and never reaches here.
      let videoBlob: Blob | undefined;
      if (lesson.localVideoFileId) {
        setStepState('download', 'active');
        videoBlob = await fileStorage.get(lesson.localVideoFileId);
        setStepState('download', 'done');
      } else if (lesson.sourceType === 'DirectUrl' && lesson.sourceUrl) {
        setStepState('download', 'active');
        const { blob } = await downloadDirectMedia(lesson.sourceUrl, (r) => setProgress(Math.round(r * 15)), ac.signal);
        const fileId = filePaths.video(lessonId);
        await fileStorage.put(fileId, blob);
        await lessonRepo.save({ ...lesson, localVideoFileId: fileId });
        videoBlob = blob;
        setStepState('download', 'done');
      }
      if (!videoBlob) throw new VideoShadowingError('VIDEO_READ_FAILED');

      // 1. Extract + normalize audio (mono / 16 kHz).
      setStepState('extract', 'active');
      await ffmpegService.load((r) => setProgress(15 + Math.round(r * 10)));
      const audio = await ffmpegService.extractAudio(videoBlob, { sampleRate: 16000, channels: 1 }, (r) => setProgress(25 + Math.round(r * 15)), ac.signal);
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
