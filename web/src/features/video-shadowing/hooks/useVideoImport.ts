// Validates + stores an uploaded/linked video locally and creates a Draft
// lesson. Subtitle parsing (when provided) produces ready-to-review segments.
// Heavy transcription is handled separately by useProcessingJob.

import { useCallback, useState } from 'react';
import {
  probeVideoDuration,
  sanitizeFilename,
  shouldWarnDuration,
  validateVideoFile,
  assertDurationWithinLimit,
} from '../utils/fileValidation';
import { fileStorage, filePaths } from '../services/storage/opfsFileStorage';
import { generateThumbnail } from '../services/media-processing/thumbnailService';
import { lessonRepo, segmentRepo } from '../services/storage/videoShadowingRepository';
import { createSubtitleParser, assertSubtitleSupported } from '../utils/subtitleParser';
import { toFriendlyError } from '../utils/errorCodes';
import type { LessonLevel, SegmentMode, VideoShadowingLesson } from '../models/lesson';

export interface ImportVideoArgs {
  videoFile: File;
  subtitleFile?: File | null;
  title: string;
  level: LessonLevel;
  topic: string;
  segmentMode: SegmentMode;
}

export interface ImportVideoResult {
  lesson: VideoShadowingLesson;
  /** True when subtitle produced segments → go straight to Review. */
  hasSegments: boolean;
}

const uid = () => `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function useVideoImport() {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationWarning, setDurationWarning] = useState(false);

  const importVideo = useCallback(async (args: ImportVideoArgs): Promise<ImportVideoResult> => {
    setImporting(true);
    setError(null);
    setDurationWarning(false);
    try {
      validateVideoFile(args.videoFile);
      if (args.subtitleFile) assertSubtitleSupported(args.subtitleFile);

      const durationMs = await probeVideoDuration(args.videoFile);
      assertDurationWithinLimit(durationMs);
      if (shouldWarnDuration(durationMs)) setDurationWarning(true);

      const lessonId = uid();
      const now = new Date().toISOString();

      // Store the original video + a generated thumbnail locally (no upload).
      await fileStorage.put(filePaths.video(lessonId), args.videoFile);
      try {
        const thumb = await generateThumbnail(args.videoFile);
        await fileStorage.put(filePaths.thumbnail(lessonId), thumb);
      } catch {
        /* thumbnail is best-effort */
      }

      let hasSegments = false;
      let status: VideoShadowingLesson['status'] = 'Pending';
      let transcriptSource: VideoShadowingLesson['transcriptSource'];

      if (args.subtitleFile) {
        const content = await args.subtitleFile.text();
        const segments = await createSubtitleParser(lessonId).parse(content);
        await segmentRepo.replaceForLesson(lessonId, segments);
        hasSegments = segments.length > 0;
        status = hasSegments ? 'Ready' : 'Pending';
        transcriptSource = 'UploadedSubtitle';
      }

      const lesson: VideoShadowingLesson = {
        id: lessonId,
        title: args.title.trim() || sanitizeFilename(args.videoFile.name),
        sourceType: 'UploadedFile',
        localVideoFileId: filePaths.video(lessonId),
        thumbnailFileId: filePaths.thumbnail(lessonId),
        durationMs,
        level: args.level,
        topic: args.topic,
        segmentMode: args.segmentMode,
        transcriptSource,
        status,
        processingProgress: hasSegments ? 100 : 0,
        safetyStatus: 'UserProvided',
        createdAt: now,
        updatedAt: now,
      };
      await lessonRepo.save(lesson);

      return { lesson, hasSegments };
    } catch (err) {
      setError(toFriendlyError(err).message);
      throw err;
    } finally {
      setImporting(false);
    }
  }, []);

  return { importVideo, importing, error, durationWarning };
}
