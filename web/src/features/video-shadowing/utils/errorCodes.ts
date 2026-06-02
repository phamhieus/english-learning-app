// Stable, machine-readable error codes + friendly user messages.
// Services throw VideoShadowingError; the UI shows the message and never a stack.

export type VideoShadowingErrorCode =
  | 'VIDEO_FORMAT_UNSUPPORTED'
  | 'VIDEO_FILE_TOO_LARGE'
  | 'VIDEO_DURATION_TOO_LONG'
  | 'VIDEO_READ_FAILED'
  | 'VIDEO_URL_INVALID'
  | 'VIDEO_URL_UNSUPPORTED'
  | 'VIDEO_URL_CORS_BLOCKED'
  | 'VIDEO_URL_FETCH_FAILED'
  | 'SUBTITLE_FORMAT_UNSUPPORTED'
  | 'SUBTITLE_PARSE_FAILED'
  | 'FFMPEG_LOAD_FAILED'
  | 'FFMPEG_PROCESS_FAILED'
  | 'WHISPER_MODEL_LOAD_FAILED'
  | 'TRANSCRIPTION_FAILED'
  | 'TRANSCRIPTION_CANCELLED'
  | 'MIC_PERMISSION_DENIED'
  | 'MIC_NOT_FOUND'
  | 'MEDIA_RECORDER_UNSUPPORTED'
  | 'RECORDING_FAILED'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'OPFS_UNSUPPORTED'
  | 'INDEXED_DB_FAILED'
  | 'BROWSER_UNSUPPORTED'
  | 'UNKNOWN';

const FRIENDLY_MESSAGES: Record<VideoShadowingErrorCode, string> = {
  VIDEO_FORMAT_UNSUPPORTED: 'This video format is not supported. Please use MP4, WebM, or MOV.',
  VIDEO_FILE_TOO_LARGE: 'The video file is too large. Please select a smaller file.',
  VIDEO_DURATION_TOO_LONG: 'The video is too long. Please use a shorter video for faster and more stable processing.',
  VIDEO_READ_FAILED: 'Could not read the video file. Please try again or select another file.',
  VIDEO_URL_INVALID: 'Invalid URL.',
  VIDEO_URL_UNSUPPORTED: 'This video URL is not supported or cannot be accessed.',
  VIDEO_URL_CORS_BLOCKED:
    'Could not import the video directly because the source blocks browser access. Please download the video legally and upload the file.',
  VIDEO_URL_FETCH_FAILED: 'Failed to download the video from this URL.',
  SUBTITLE_FORMAT_UNSUPPORTED: 'Only .srt or .vtt subtitle formats are supported.',
  SUBTITLE_PARSE_FAILED: 'Could not read the subtitle file. The file format might be corrupt.',
  FFMPEG_LOAD_FAILED: 'Failed to load the video processor. Please check your network connection and try again.',
  FFMPEG_PROCESS_FAILED: 'Audio processing failed. Please try again.',
  WHISPER_MODEL_LOAD_FAILED: 'Failed to load the speech recognition model. Please try again.',
  TRANSCRIPTION_FAILED: 'Transcription failed. Please try again.',
  TRANSCRIPTION_CANCELLED: 'Transcription cancelled.',
  MIC_PERMISSION_DENIED: 'Microphone permission is required to record. Please enable it in your browser settings.',
  MIC_NOT_FOUND: 'Microphone not found. Please connect a microphone and try again.',
  MEDIA_RECORDER_UNSUPPORTED: 'The browser does not support audio recording. Please use a modern version of Chrome or Edge.',
  RECORDING_FAILED: 'Recording was interrupted. Please try again.',
  STORAGE_QUOTA_EXCEEDED: 'Insufficient browser storage. Please delete some lessons or free up space.',
  OPFS_UNSUPPORTED: 'The browser does not support advanced file storage — falling back to a storage option with limited capacity.',
  INDEXED_DB_FAILED: 'Could not access the browser local storage.',
  BROWSER_UNSUPPORTED: 'Your browser does not meet the capabilities for this feature. Please use a modern version of Chrome or Edge.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

export class VideoShadowingError extends Error {
  readonly code: VideoShadowingErrorCode;
  /** Original underlying error, logged at the service layer (never shown raw). */
  readonly cause?: unknown;

  constructor(code: VideoShadowingErrorCode, cause?: unknown, messageOverride?: string) {
    super(messageOverride ?? FRIENDLY_MESSAGES[code]);
    this.name = 'VideoShadowingError';
    this.code = code;
    this.cause = cause;
  }
}

export function friendlyMessage(code: VideoShadowingErrorCode): string {
  return FRIENDLY_MESSAGES[code] ?? FRIENDLY_MESSAGES.UNKNOWN;
}

/** Narrow an unknown caught value to a friendly message + code for the UI. */
export function toFriendlyError(err: unknown): { code: VideoShadowingErrorCode; message: string } {
  if (err instanceof VideoShadowingError) {
    return { code: err.code, message: err.message };
  }
  return { code: 'UNKNOWN', message: FRIENDLY_MESSAGES.UNKNOWN };
}
