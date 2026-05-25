export function buildFakeTranscriptWords(targetText: string): string[] {
  if (!targetText) return [];
  // Split by whitespace
  return targetText.trim().split(/\s+/).filter(w => w.length > 0);
}
