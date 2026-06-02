// Decode any browser-playable audio (WAV from ffmpeg, or webm/opus from the
// recorder) into a mono Float32Array at 16 kHz — the format Whisper expects.
// Runs on the main thread (AudioContext isn't available in workers).

import { VideoShadowingError } from '../../utils/errorCodes';

const TARGET_RATE = 16000;

type AudioCtor = typeof AudioContext;

function getAudioContextCtor(): AudioCtor | null {
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export async function decodeToMono16k(data: ArrayBuffer): Promise<Float32Array> {
  const Ctor = getAudioContextCtor();
  if (!Ctor || typeof OfflineAudioContext === 'undefined') {
    throw new VideoShadowingError('TRANSCRIPTION_FAILED', undefined, 'The browser does not support audio decoding.');
  }

  const ctx = new Ctor();
  let decoded: AudioBuffer;
  try {
    // decodeAudioData detaches the buffer, so hand it a copy.
    decoded = await ctx.decodeAudioData(data.slice(0));
  } catch (err) {
    throw new VideoShadowingError('TRANSCRIPTION_FAILED', err, 'Failed to decode audio.');
  } finally {
    await ctx.close().catch(() => {});
  }

  if (decoded.sampleRate === TARGET_RATE && decoded.numberOfChannels === 1) {
    return decoded.getChannelData(0).slice();
  }

  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * TARGET_RATE), TARGET_RATE);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0).slice();
}
