// Captures the audio of a shared browser tab via getDisplayMedia, so a YouTube
// (embed-only) video can be transcribed locally. The user must explicitly share
// the tab WITH audio — we never tap audio without consent, and nothing is
// uploaded. Audio-only is recorded; the (required) video track is kept alive but
// unused so the browser doesn't end the capture.

import { VideoShadowingError } from '../../utils/errorCodes';

const AUDIO_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];

export function pickAudioMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  return AUDIO_MIME_CANDIDATES.find((t) => {
    try {
      return MediaRecorder.isTypeSupported(t);
    } catch {
      return false;
    }
  }) ?? '';
}

export async function captureTabAudio(): Promise<MediaStream> {
  const md = navigator.mediaDevices as MediaDevices & {
    getDisplayMedia?: (c: DisplayMediaStreamOptions) => Promise<MediaStream>;
  };
  if (!md?.getDisplayMedia) {
    throw new VideoShadowingError('BROWSER_UNSUPPORTED', undefined, 'Trình duyệt không hỗ trợ chia sẻ tab. Hãy dùng Chrome/Edge mới.');
  }

  let stream: MediaStream;
  try {
    // Video is required by the picker; we only keep the audio.
    stream = await md.getDisplayMedia({ video: true, audio: true });
  } catch (err) {
    throw new VideoShadowingError('RECORDING_FAILED', err, 'Đã hủy chia sẻ tab. Hãy thử lại và chọn tab đang phát video.');
  }

  if (stream.getAudioTracks().length === 0) {
    stream.getTracks().forEach((t) => t.stop());
    throw new VideoShadowingError(
      'RECORDING_FAILED',
      undefined,
      'Không bắt được âm thanh. Khi chia sẻ, hãy chọn đúng tab và tích "Chia sẻ âm thanh của tab".',
    );
  }
  return stream;
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}
