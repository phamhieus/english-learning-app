// Controls an HTMLVideoElement for segment-based shadowing: seek to a segment,
// stop at its end, optional loop. Event-driven (timeupdate/seeking/ended/
// loadedmetadata) — no high-frequency polling (spec §16).
//
// Uses a CALLBACK ref so listeners bind whenever the <video> actually mounts —
// the practice page renders a loading state first, so a one-time effect would
// miss the element and leave the scrubber / play-state dead.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoTranscriptSegment } from '../models/segment';

export type PlaybackRate = 0.75 | 1 | 1.25;

// Clamp a target time (ms) into the loaded video's range — handles placeholder
// clips shorter than a segment's timestamp; a no-op for matching videos.
function seekTo(video: HTMLVideoElement, ms: number) {
  const dur = video.duration;
  let t = ms / 1000;
  if (Number.isFinite(dur) && dur > 0) t = Math.min(t, Math.max(0, dur - 0.05));
  video.currentTime = Math.max(0, t);
}

interface UseVideoSegmentPlayerArgs {
  segments: VideoTranscriptSegment[];
  activeSegmentId: string | null;
  loopEnabled: boolean;
  playbackRate: PlaybackRate;
}

interface UseVideoSegmentPlayerReturn {
  videoRef: (node: HTMLVideoElement | null) => void;
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;
  ready: boolean;
  playSegment: (segmentId?: string) => void;
  playAll: () => void;
  seekToSegment: (segmentId: string) => void;
  pause: () => void;
  replay: () => void;
}

export function useVideoSegmentPlayer({
  segments,
  activeSegmentId,
  loopEnabled,
  playbackRate,
}: UseVideoSegmentPlayerArgs): UseVideoSegmentPlayerReturn {
  const elRef = useRef<HTMLVideoElement | null>(null);
  const detachRef = useRef<(() => void) | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [ready, setReady] = useState(false);

  // Latest values in refs so listeners don't need re-binding each render.
  const loopRef = useRef(loopEnabled);
  const activeRef = useRef(activeSegmentId);
  const segmentsRef = useRef(segments);
  const rateRef = useRef(playbackRate);
  useEffect(() => {
    loopRef.current = loopEnabled;
    activeRef.current = activeSegmentId;
    segmentsRef.current = segments;
    rateRef.current = playbackRate;
  });

  // Callback ref — binds listeners directly to the node when it mounts, detaches
  // on unmount. Handlers operate on the element param (not reactive state).
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    detachRef.current?.();
    detachRef.current = null;
    elRef.current = node;
    if (!node) {
      setReady(false);
      return;
    }
    const onLoaded = () => {
      setDurationMs(Number.isFinite(node.duration) ? node.duration * 1000 : 0);
      setReady(true);
      node.playbackRate = rateRef.current;
    };
    const onTimeUpdate = () => {
      setCurrentTimeMs(node.currentTime * 1000);
      // Loop mode = focused single-segment practice: bounce back at its end.
      // Otherwise play straight through the whole video (highlight follows).
      if (loopRef.current) {
        const seg = segmentsRef.current.find((s) => s.id === activeRef.current);
        if (seg && node.currentTime * 1000 >= seg.endMs - 30) node.currentTime = seg.startMs / 1000;
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    node.addEventListener('loadedmetadata', onLoaded);
    node.addEventListener('timeupdate', onTimeUpdate);
    node.addEventListener('play', onPlay);
    node.addEventListener('pause', onPause);
    node.addEventListener('ended', onEnded);
    if (node.readyState >= 1) onLoaded();

    detachRef.current = () => {
      node.removeEventListener('loadedmetadata', onLoaded);
      node.removeEventListener('timeupdate', onTimeUpdate);
      node.removeEventListener('play', onPlay);
      node.removeEventListener('pause', onPause);
      node.removeEventListener('ended', onEnded);
    };
  }, []);

  // Apply playback rate live.
  useEffect(() => {
    if (elRef.current) elRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Play a single segment from its start (focused practice / "Play Original").
  const playSegment = useCallback((segmentId?: string) => {
    const video = elRef.current;
    if (!video) return;
    const seg =
      (segmentId && segmentsRef.current.find((s) => s.id === segmentId)) ||
      segmentsRef.current.find((s) => s.id === activeRef.current);
    if (seg) seekTo(video, seg.startMs);
    video.playbackRate = rateRef.current;
    video.muted = false;
    video.volume = 1;
    void video.play().catch(() => setIsPlaying(false));
  }, []);

  // Play the whole video continuously from the current position (highlight is
  // tracked by the caller via currentTimeMs).
  const playAll = useCallback(() => {
    const video = elRef.current;
    if (!video) return;
    video.playbackRate = rateRef.current;
    video.muted = false;
    video.volume = 1;
    void video.play().catch(() => setIsPlaying(false));
  }, []);

  // Jump to a segment's start without playing (timeline / prev / next).
  const seekToSegment = useCallback((segmentId: string) => {
    const video = elRef.current;
    const seg = segmentsRef.current.find((s) => s.id === segmentId);
    if (video && seg) seekTo(video, seg.startMs);
  }, []);

  const pause = useCallback(() => elRef.current?.pause(), []);

  const replay = useCallback(() => playSegment(activeRef.current ?? undefined), [playSegment]);

  return { videoRef, isPlaying, currentTimeMs, durationMs, ready, playSegment, playAll, seekToSegment, pause, replay };
}
