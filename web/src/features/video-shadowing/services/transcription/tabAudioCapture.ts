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
    throw new VideoShadowingError('BROWSER_UNSUPPORTED', undefined, 'The browser does not support tab sharing. Please use a modern version of Chrome/Edge.');
  }

  let stream: MediaStream;
  try {
    // Video is required by the picker; we only keep the audio.
    stream = await md.getDisplayMedia({ video: true, audio: true });
  } catch (err) {
    throw new VideoShadowingError('RECORDING_FAILED', err, 'Tab sharing cancelled. Please try again and select the tab playing the video.');
  }

  if (stream.getAudioTracks().length === 0) {
    stream.getTracks().forEach((t) => t.stop());
    throw new VideoShadowingError(
      'RECORDING_FAILED',
      undefined,
      'Could not capture audio. When sharing, select the correct tab and check "Share tab audio".',
    );
  }
  return stream;
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}
