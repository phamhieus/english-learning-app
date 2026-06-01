// Downloads a direct media URL into a local Blob so it can be processed
// (audio extraction → transcription) like an uploaded file. We never proxy or
// bypass CORS: if the browser fetch is blocked, we surface a clear error telling
// the user to download legally and upload the file instead (spec §15).

import { VideoShadowingError } from '../../utils/errorCodes';
import { mediaKindFromContentType } from '../../utils/urlValidation';

export interface DirectDownloadResult {
  blob: Blob;
  contentType: string | null;
}

export async function downloadDirectMedia(
  url: string,
  onProgress?: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<DirectDownloadResult> {
  let res: Response;
  try {
    res = await fetch(url, { signal, mode: 'cors', redirect: 'follow' });
  } catch (err) {
    // A cross-origin fetch without CORS headers throws a TypeError here.
    if (signal?.aborted) throw new VideoShadowingError('TRANSCRIPTION_CANCELLED', err);
    throw new VideoShadowingError('VIDEO_URL_CORS_BLOCKED', err);
  }

  if (!res.ok) {
    throw new VideoShadowingError(res.status === 403 || res.status === 401 ? 'VIDEO_URL_CORS_BLOCKED' : 'VIDEO_URL_FETCH_FAILED');
  }

  const contentType = res.headers.get('content-type');
  // If the server declares a type, make sure it's actually media.
  if (contentType && mediaKindFromContentType(contentType) === null && !contentType.startsWith('application/octet-stream')) {
    throw new VideoShadowingError('VIDEO_URL_UNSUPPORTED');
  }

  // Stream with progress when Content-Length is known; otherwise just blob().
  const total = Number(res.headers.get('content-length') ?? 0);
  if (onProgress && total > 0 && res.body) {
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.length;
        onProgress(Math.min(1, received / total));
      }
    }
    return { blob: new Blob(chunks as BlobPart[], { type: contentType ?? 'video/mp4' }), contentType };
  }

  const blob = await res.blob();
  onProgress?.(1);
  return { blob, contentType };
}
