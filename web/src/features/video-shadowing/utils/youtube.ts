// YouTube helpers. We never download or scrape YouTube — playback uses the
// official IFrame embed player (ToS-compliant). Because the embed gives no
// access to the media stream, YouTube lessons can't auto-extract audio for
// transcription and rely on an uploaded subtitle (or manual segments).

const ID_PATTERNS = [
  /(?:youtube\.com\/watch\?[^#]*?\bv=)([\w-]{11})/i,
  /youtu\.be\/([\w-]{11})/i,
  /youtube\.com\/embed\/([\w-]{11})/i,
  /youtube\.com\/shorts\/([\w-]{11})/i,
  /youtube\.com\/live\/([\w-]{11})/i,
];

export function parseYouTubeId(url: string): string | null {
  for (const re of ID_PATTERNS) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return parseYouTubeId(url) != null;
}

/** Canonical watch URL for storage/display. */
export function youTubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** Optional start time from `t=`/`start=` (seconds). */
export function parseStartSeconds(url: string): number {
  const m = url.match(/[?&#](?:t|start)=(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}
