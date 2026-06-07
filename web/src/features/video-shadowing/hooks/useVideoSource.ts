// Attaches a media URL to an HTMLVideoElement, transparently handling both
// progressive files (mp4/webm) and HLS playlists (.m3u8). VOA streams via HLS,
// which Chrome/Edge/Firefox cannot play natively — those go through hls.js.
// Safari plays HLS natively, so we let the browser handle it via el.src there.
//
// Returns a CALLBACK ref (same pattern as useVideoSegmentPlayer) so source
// attachment binds whenever the <video> mounts; an effect re-attaches when the
// URL changes while the element stays mounted.

import { useCallback, useEffect, useRef } from 'react';
import Hls from 'hls.js';

const isHlsUrl = (url: string) => /\.m3u8(\?|#|$)/i.test(url);

export function useVideoSource(url: string | null): (node: HTMLVideoElement | null) => void {
  const elRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const attach = useCallback(() => {
    const el = elRef.current;
    // Tear down any previous hls.js instance before (re)binding a source.
    hlsRef.current?.destroy();
    hlsRef.current = null;
    if (!el) return;

    if (!url) {
      el.removeAttribute('src');
      el.load();
      return;
    }

    const nativeHls = el.canPlayType('application/vnd.apple.mpegurl') !== '';
    if (isHlsUrl(url) && !nativeHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(el);
      hlsRef.current = hls;
    } else {
      // Progressive file, or HLS on a browser with native support.
      el.src = url;
    }
  }, [url]);

  const ref = useCallback(
    (node: HTMLVideoElement | null) => {
      elRef.current = node;
      attach();
    },
    [attach],
  );

  // Re-attach when the URL changes while the element is already mounted.
  useEffect(() => {
    attach();
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [attach]);

  return ref;
}
