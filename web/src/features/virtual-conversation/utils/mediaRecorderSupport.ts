const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/wav",
];

/** Returns the first MIME type supported by this browser, or undefined for browser default. */
export function getSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return PREFERRED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

export function getMediaRecorderOptions(): MediaRecorderOptions {
  const mimeType = getSupportedMimeType();
  return mimeType ? { mimeType } : {};
}
