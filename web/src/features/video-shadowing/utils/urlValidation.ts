// Direct-media URL validation (spec §15). We only accept https URLs that point
// at a directly-playable media file. We never scrape, proxy, or bypass CORS.

import { VideoShadowingError } from './errorCodes';

const VIDEO_EXTS = ['mp4', 'webm', 'mov'];
const AUDIO_EXTS = ['mp3', 'wav', 'm4a'];

const BLOCKED_HOST_PATTERNS = [
  /(^|\.)youtube\.com$/i,
  /(^|\.)youtu\.be$/i,
  /(^|\.)tiktok\.com$/i,
  /(^|\.)facebook\.com$/i,
  /(^|\.)fb\.watch$/i,
  /(^|\.)instagram\.com$/i,
];

export type MediaKind = 'video' | 'audio';

export interface ParsedMediaUrl {
  url: string;
  kind: MediaKind;
  ext: string;
}

function extFromPath(pathname: string): string {
  const clean = pathname.split('?')[0].split('#')[0];
  const i = clean.lastIndexOf('.');
  return i >= 0 ? clean.slice(i + 1).toLowerCase() : '';
}

/**
 * Validate a pasted URL. Throws VideoShadowingError for unsupported/blocked
 * links. Does NOT perform any network request — that happens later (with CORS
 * handled by the browser) in directUrlResolver.
 */
export function validateMediaUrl(raw: string): ParsedMediaUrl {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new VideoShadowingError('VIDEO_URL_INVALID');
  }

  if (parsed.protocol !== 'https:') {
    throw new VideoShadowingError('VIDEO_URL_UNSUPPORTED');
  }
  if (BLOCKED_HOST_PATTERNS.some((re) => re.test(parsed.hostname))) {
    // Streaming sites — not direct media, and downloading is out of scope.
    throw new VideoShadowingError('VIDEO_URL_UNSUPPORTED');
  }

  const ext = extFromPath(parsed.pathname);
  if (VIDEO_EXTS.includes(ext)) return { url: parsed.toString(), kind: 'video', ext };
  if (AUDIO_EXTS.includes(ext)) return { url: parsed.toString(), kind: 'audio', ext };

  throw new VideoShadowingError('VIDEO_URL_UNSUPPORTED');
}

/** Lightweight check for the input field (no throwing) — to enable the button. */
export function looksLikeDirectMediaUrl(raw: string): boolean {
  try {
    validateMediaUrl(raw);
    return true;
  } catch {
    return false;
  }
}

/** Map a fetched Content-Type to a supported media kind, or null. */
export function mediaKindFromContentType(contentType: string | null): MediaKind | null {
  if (!contentType) return null;
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  return null;
}
