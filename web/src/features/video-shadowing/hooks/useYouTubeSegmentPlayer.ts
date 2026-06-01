// Segment-based player for YouTube lessons using the OFFICIAL IFrame Player API
// (no download/scraping). Mirrors useVideoSegmentPlayer's surface so the
// Practice page can use either. Position is polled (the API has no timeupdate).

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoTranscriptSegment } from '../models/segment';
import type { PlaybackRate } from './useVideoSegmentPlayer';

// Minimal typings for the slice of the IFrame API we use.
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setPlaybackRate(rate: number): void;
  destroy(): void;
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: unknown) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return apiPromise;
}

interface Args {
  videoId: string | null;
  segments: VideoTranscriptSegment[];
  activeSegmentId: string | null;
  loopEnabled: boolean;
  playbackRate: PlaybackRate;
}

interface Return {
  containerRef: (node: HTMLDivElement | null) => void;
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

export function useYouTubeSegmentPlayer({ videoId, segments, activeSegmentId, loopEnabled, playbackRate }: Args): Return {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [ready, setReady] = useState(false);

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

  const containerRef = useCallback((node: HTMLDivElement | null) => setEl(node), []);

  useEffect(() => {
    if (!el || !videoId) return;
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | null = null;
    let player: YTPlayer | null = null;

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      player = new YT.Player(el, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, controls: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            playerRef.current = e.target;
            setDurationMs(e.target.getDuration() * 1000);
            e.target.setPlaybackRate(rateRef.current);
            setReady(true);
          },
          onStateChange: (e: { data: number }) => {
            setIsPlaying(e.data === YT.PlayerState.PLAYING);
            if (e.data === YT.PlayerState.ENDED) setIsPlaying(false);
          },
        },
      });
      // Poll position (~5/s) for the scrubber + segment highlighting + loop.
      poll = setInterval(() => {
        const p = playerRef.current;
        if (!p || typeof p.getCurrentTime !== 'function') return;
        const tMs = p.getCurrentTime() * 1000;
        setCurrentTimeMs(tMs);
        if (loopRef.current) {
          const seg = segmentsRef.current.find((s) => s.id === activeRef.current);
          if (seg && tMs >= seg.endMs - 120) p.seekTo(seg.startMs / 1000, true);
        }
      }, 200);
    });

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
      setReady(false);
    };
  }, [el, videoId]);

  useEffect(() => {
    playerRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate]);

  const playSegment = useCallback((segmentId?: string) => {
    const p = playerRef.current;
    if (!p) return;
    const seg =
      (segmentId && segmentsRef.current.find((s) => s.id === segmentId)) ||
      segmentsRef.current.find((s) => s.id === activeRef.current);
    if (seg) p.seekTo(seg.startMs / 1000, true);
    p.setPlaybackRate(rateRef.current);
    p.playVideo();
  }, []);

  const playAll = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const seekToSegment = useCallback((segmentId: string) => {
    const seg = segmentsRef.current.find((s) => s.id === segmentId);
    if (seg) playerRef.current?.seekTo(seg.startMs / 1000, true);
  }, []);

  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const replay = useCallback(() => playSegment(activeRef.current ?? undefined), [playSegment]);

  return { containerRef, isPlaying, currentTimeMs, durationMs, ready, playSegment, playAll, seekToSegment, pause, replay };
}
