// Reuse the battle-tested recorder hook from the existing Shadowing feature
// (permission states, silence detection, MIME fallback, cleanup). Re-exported
// here so the Video Shadowing module has a stable local import path.

export {
  useAudioRecorder,
  type RecordingStatus,
} from '../../shadowing/hooks/useAudioRecorder';
