// Controls an HTMLVideoElement for segment-based shadowing: seek to a segment,
// stop at its end, optional loop. Event-driven (timeupdate/seeking/ended/
// loadedmetadata) — no high-frequency polling (spec §16).

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoTranscriptSegment } from '../models/segment';

export type PlaybackRate = 0.75 | 1 | 1.25;

interface UseVideoSegmentPlayerArgs {
  segments: VideoTranscriptSegment[];
  activeSegmentId: string | null;
  loopEnabled: boolean;
  playbackRate: PlaybackRate;
}

interface UseVideoSegmentPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;
  ready: boolean;
  playSegment: (segmentId?: string) => void;
  pause: () => void;
  replay: () => void;
}

export function useVideoSegmentPlayer({
  segments,
  activeSegmentId,
  loopEnabled,
  playbackRate,
}: UseVideoSegmentPlayerArgs): UseVideoSegmentPlayerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [ready, setReady] = useState(false);

  // Keep latest values in refs so listeners don't need re-binding each render.
  const loopRef = useRef(loopEnabled);
  const activeRef = useRef(activeSegmentId);
  const segmentsRef = useRef(segments);
  useEffect(() => {
    loopRef.current = loopEnabled;
    activeRef.current = activeSegmentId;
    segmentsRef.current = segments;
  });

  const activeSegment = segments.find((s) => s.id === activeSegmentId) ?? null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      setDurationMs(Number.isFinite(video.duration) ? video.duration * 1000 : 0);
      setReady(true);
    };
    const onTimeUpdate = () => {
      const tMs = video.currentTime * 1000;
      setCurrentTimeMs(tMs);
      const seg = segmentsRef.current.find((s) => s.id === activeRef.current);
      if (seg && tMs >= seg.endMs - 30) {
        if (loopRef.current) {
          video.currentTime = seg.startMs / 1000;
        } else {
          video.pause();
        }
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    if (video.readyState >= 1) onLoaded();

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  // Apply playback rate.
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Seek to the start of a newly-selected segment.
  useEffect(() => {
    const video = videoRef.current;
    if (video && activeSegment && ready) {
      video.currentTime = activeSegment.startMs / 1000;
    }
  }, [activeSegmentId, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const playSegment = useCallback(
    (segmentId?: string) => {
      const video = videoRef.current;
      if (!video) return;
      const seg =
        (segmentId && segmentsRef.current.find((s) => s.id === segmentId)) ||
        segmentsRef.current.find((s) => s.id === activeRef.current);
      if (seg) video.currentTime = seg.startMs / 1000;
      video.playbackRate = playbackRate;
      void video.play().catch(() => setIsPlaying(false));
    },
    [playbackRate],
  );

  const pause = useCallback(() => videoRef.current?.pause(), []);

  const replay = useCallback(() => playSegment(activeRef.current ?? undefined), [playSegment]);

  return { videoRef, isPlaying, currentTimeMs, durationMs, ready, playSegment, pause, replay };
}
