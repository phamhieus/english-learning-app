// Stable, machine-readable error codes + friendly (Vietnamese) user messages.
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
  VIDEO_FORMAT_UNSUPPORTED: 'Định dạng video này không được hỗ trợ. Hãy dùng MP4, WebM hoặc MOV.',
  VIDEO_FILE_TOO_LARGE: 'Video quá lớn. Vui lòng chọn file nhỏ hơn.',
  VIDEO_DURATION_TOO_LONG: 'Video quá dài. Hãy dùng video ngắn hơn để xử lý nhanh và ổn định.',
  VIDEO_READ_FAILED: 'Không đọc được video. Hãy thử lại hoặc chọn file khác.',
  VIDEO_URL_INVALID: 'Đường dẫn không hợp lệ.',
  VIDEO_URL_UNSUPPORTED: 'Đường dẫn video này không được hỗ trợ hoặc không thể truy cập.',
  VIDEO_URL_CORS_BLOCKED:
    'Không thể nhập video trực tiếp vì nguồn không cho phép trình duyệt truy cập. Vui lòng tải video về một cách hợp pháp rồi upload file.',
  VIDEO_URL_FETCH_FAILED: 'Không tải được video từ đường dẫn này.',
  SUBTITLE_FORMAT_UNSUPPORTED: 'Chỉ hỗ trợ phụ đề .srt hoặc .vtt.',
  SUBTITLE_PARSE_FAILED: 'Không đọc được file phụ đề. File có thể bị lỗi định dạng.',
  FFMPEG_LOAD_FAILED: 'Không tải được bộ xử lý video. Hãy kiểm tra kết nối mạng và thử lại.',
  FFMPEG_PROCESS_FAILED: 'Xử lý audio thất bại. Vui lòng thử lại.',
  WHISPER_MODEL_LOAD_FAILED: 'Không tải được mô hình nhận dạng giọng nói. Hãy thử lại.',
  TRANSCRIPTION_FAILED: 'Tạo script thất bại. Vui lòng thử lại.',
  TRANSCRIPTION_CANCELLED: 'Đã hủy tạo script.',
  MIC_PERMISSION_DENIED: 'Bạn cần cấp quyền micro để ghi âm. Hãy bật quyền trong cài đặt trình duyệt.',
  MIC_NOT_FOUND: 'Không tìm thấy micro. Hãy kết nối micro rồi thử lại.',
  MEDIA_RECORDER_UNSUPPORTED: 'Trình duyệt không hỗ trợ ghi âm. Hãy dùng Chrome hoặc Edge mới.',
  RECORDING_FAILED: 'Ghi âm bị gián đoạn. Vui lòng thử lại.',
  STORAGE_QUOTA_EXCEEDED: 'Bộ nhớ trình duyệt không đủ. Hãy xóa bớt bài hoặc giải phóng dung lượng.',
  OPFS_UNSUPPORTED: 'Trình duyệt không hỗ trợ lưu file nâng cao — sẽ dùng phương án dự phòng với dung lượng hạn chế hơn.',
  INDEXED_DB_FAILED: 'Không truy cập được bộ nhớ cục bộ của trình duyệt.',
  BROWSER_UNSUPPORTED: 'Trình duyệt chưa đủ khả năng cho tính năng này. Hãy dùng Chrome hoặc Edge phiên bản mới.',
  UNKNOWN: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.',
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
