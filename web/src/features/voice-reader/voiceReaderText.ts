export interface VoiceReaderSegment {
  id: string;
  text: string;
}

export function splitVoiceReaderText(text: string): VoiceReaderSegment[] {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => ({ id: `seg-${index}`, text: part }));
}

export function makeVoiceReaderSegments(lines: string[]): VoiceReaderSegment[] {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text, index) => ({ id: `line-${index}`, text }));
}
