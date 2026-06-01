// Reads a subtitle File and parses it into segments for a given lesson.

import { useCallback, useState } from 'react';
import { assertSubtitleSupported, createSubtitleParser } from '../utils/subtitleParser';
import { toFriendlyError } from '../utils/errorCodes';
import type { VideoTranscriptSegment } from '../models/segment';

interface UseSubtitleParser {
  parseFile: (file: File, lessonId: string) => Promise<VideoTranscriptSegment[]>;
  parsing: boolean;
  error: string | null;
}

export function useSubtitleParser(): UseSubtitleParser {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(async (file: File, lessonId: string) => {
    setParsing(true);
    setError(null);
    try {
      assertSubtitleSupported(file);
      const content = await file.text();
      const parser = createSubtitleParser(lessonId);
      return await parser.parse(content);
    } catch (err) {
      const { message } = toFriendlyError(err);
      setError(message);
      throw err;
    } finally {
      setParsing(false);
    }
  }, []);

  return { parseFile, parsing, error };
}
