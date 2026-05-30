// Generates a cover thumbnail from a video Blob using a <video> + <canvas>.
// Pure web — no ffmpeg dependency required.

import { VideoShadowingError } from '../../utils/errorCodes';

export async function generateThumbnail(
  videoBlob: Blob,
  atSeconds = 1,
  maxWidth = 640,
): Promise<Blob> {
  const url = URL.createObjectURL(videoBlob);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.crossOrigin = 'anonymous';

  const cleanup = () => {
    URL.revokeObjectURL(url);
    video.removeAttribute('src');
    video.load();
  };

  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(atSeconds, Math.max(0, (video.duration || 1) - 0.1));
      };
      video.onseeked = () => {
        const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new VideoShadowingError('VIDEO_READ_FAILED'));
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (out) => (out ? resolve(out) : reject(new VideoShadowingError('VIDEO_READ_FAILED'))),
          'image/jpeg',
          0.82,
        );
      };
      video.onerror = () => reject(new VideoShadowingError('VIDEO_READ_FAILED'));
      video.src = url;
    });
    return blob;
  } finally {
    cleanup();
  }
}
