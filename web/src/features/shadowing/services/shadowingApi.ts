import type {
  ShadowingAttempt,
  ShadowingLesson,
  ShadowingSegment,
  ShadowingSegmentSummary,
  ShadowingSession,
  ShadowingSessionResult,
  WeakWord,
  WordResult,
} from '../types/shadowing.types';
import { mockShadowingLesson } from '../data/mockShadowingData';
import { hasApiKey, type AppSettings } from '../../../components/settings-context';
import { evaluateShadowing } from '../../../services/ai';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function cleanWord(w: string): string {
  return w.toLowerCase().replace(/[.,!?;:'"()\-]/g, '').trim();
}

function wordSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const maxLength = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / maxLength;
}

function compareWords(original: string, recognized: string): WordResult[] {
  const origWords = original.split(/\s+/).filter(Boolean);
  const recogWords = recognized.split(/\s+/).filter(Boolean);
  const origClean = origWords.map(cleanWord);
  const recogClean = recogWords.map(cleanWord);
  const m = origWords.length;
  const n = recogWords.length;

  const substitutionCost = (orig: string, recog: string) => {
    if (orig === recog) return 0;
    const similarity = wordSimilarity(orig, recog);
    if (orig.length > 3 && similarity >= 0.62) return 0.45;
    return 0.9;
  };

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const back: ('match' | 'delete' | 'insert')[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill('match')
  );

  for (let i = 1; i <= m; i++) {
    dp[i][0] = i;
    back[i][0] = 'delete';
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = j;
    back[0][j] = 'insert';
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const matchCost = dp[i - 1][j - 1] + substitutionCost(origClean[i - 1], recogClean[j - 1]);
      const deleteCost = dp[i - 1][j] + 1;
      const insertCost = dp[i][j - 1] + 1;
      const best = Math.min(matchCost, deleteCost, insertCost);

      dp[i][j] = best;
      if (best === matchCost) back[i][j] = 'match';
      else if (best === deleteCost) back[i][j] = 'delete';
      else back[i][j] = 'insert';
    }
  }

  const results: WordResult[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    const step = back[i][j];

    if (i > 0 && j > 0 && step === 'match') {
      const orig = origClean[i - 1];
      const recog = recogClean[j - 1];
      const similarity = wordSimilarity(orig, recog);
      const status =
        orig === recog
          ? 'correct'
          : orig.length > 3 && similarity >= 0.62
            ? 'weak_pronunciation'
            : 'wrong';
      results.push({
        word: origWords[i - 1],
        spokenWord: recogWords[j - 1],
        status,
        ...(status !== 'correct' ? { comment: `You said "${recogWords[j - 1]}"` } : {}),
      });
      i--;
      j--;
      continue;
    }

    if (i > 0 && (step === 'delete' || j === 0)) {
      results.push({ word: origWords[i - 1], status: 'missing' });
      i--;
      continue;
    }

    if (j > 0) {
      results.push({ word: recogWords[j - 1], status: 'extra' });
      j--;
    }
  }

  return results.reverse();
}

/** Deterministic local scoring based purely on word comparison. No randomness. */
function computeLocalScoring(
  recognizedText: string,
  wordResults: WordResult[]
): {
  finalScore: number;
  pronunciationScore: number;
  completenessScore: number;
  fluencyScore: number;
  rhythmScore: number;
  intonationScore: number;
  feedback: string;
} {
  if (!recognizedText.trim()) {
    return {
      finalScore: 0,
      pronunciationScore: 0,
      completenessScore: 0,
      fluencyScore: 0,
      rhythmScore: 0,
      intonationScore: 0,
      feedback:
        'No speech was detected. Please check your microphone, then click Start Shadowing and speak clearly.',
    };
  }

  const targetWords = wordResults.filter(w => w.status !== 'extra');
  const correctCount = wordResults.filter(w => w.status === 'correct').length;
  const weakCount = wordResults.filter(w => w.status === 'weak_pronunciation').length;
  const missingCount = wordResults.filter(w => w.status === 'missing').length;
  const wrongCount = wordResults.filter(w => w.status === 'wrong').length;
  const extraCount = wordResults.filter(w => w.status === 'extra').length;
  const total = Math.max(1, targetWords.length);

  // Pronunciation: correct + half-credit for weak
  const pronunciation = Math.round(((correctCount + weakCount * 0.5) / total) * 100);
  // Completeness: how much of target was spoken (correct + weak + wrong all count as "spoken something")
  const completeness = Math.round(
    ((correctCount + weakCount + wrongCount) / total) * 100
  );
  // Fluency: penalize extras (false starts) and missing words
  const fluency = Math.max(
    0,
    Math.round(100 - (missingCount * 12 + extraCount * 8))
  );
  // Rhythm & intonation: approximate from accuracy (STT alone can't measure prosody well)
  const rhythm = Math.round((pronunciation + completeness) / 2);
  const intonation = rhythm;
  // Final: weighted average
  const finalScore = Math.round(
    pronunciation * 0.35 +
      completeness * 0.30 +
      fluency * 0.15 +
      rhythm * 0.10 +
      intonation * 0.10
  );

  const feedback = buildLocalFeedback({
    finalScore,
    correctCount,
    weakCount,
    missingCount,
    wrongCount,
    total,
  });

  return {
    finalScore: clamp(finalScore),
    pronunciationScore: clamp(pronunciation),
    completenessScore: clamp(completeness),
    fluencyScore: clamp(fluency),
    rhythmScore: clamp(rhythm),
    intonationScore: clamp(intonation),
    feedback,
  };
}

function clamp(v: number): number {
  return Math.min(100, Math.max(0, v));
}

function buildLocalFeedback(stats: {
  finalScore: number;
  correctCount: number;
  weakCount: number;
  missingCount: number;
  wrongCount: number;
  total: number;
}): string {
  const { finalScore, weakCount, missingCount, wrongCount, total } = stats;
  const errorRate = (missingCount + wrongCount + weakCount) / total;

  if (finalScore >= 85)
    return 'Excellent! Your pronunciation matches the target closely. Keep this rhythm.';
  if (finalScore >= 70)
    return 'Good attempt — most words were clear. Focus on the highlighted weak/wrong words for next try.';
  if (finalScore >= 50)
    return `Partial match. ${missingCount > 0 ? `You missed ${missingCount} word${missingCount > 1 ? 's' : ''}. ` : ''}Slow down and articulate each word fully.`;
  if (errorRate > 0.6 && finalScore < 30)
    return 'The speech-to-text barely matched the target. Speak louder and more slowly, and check your microphone.';
  return 'Many words were missed or mispronounced. Listen to the sample again, then shadow one phrase at a time.';
}

function hasValidApiKey(settings?: AppSettings): boolean {
  return settings ? hasApiKey(settings) : false;
}

export const shadowingApi = {
  async getMockShadowingLesson(): Promise<ShadowingLesson> {
    await delay(200);
    return JSON.parse(JSON.stringify(mockShadowingLesson)) as ShadowingLesson;
  },

  async createShadowingSession(lessonId: string): Promise<ShadowingSession> {
    await delay(200);
    return {
      id: generateId('session'),
      lessonId,
      startedAt: new Date().toISOString(),
      totalSegments: mockShadowingLesson.totalSegments,
      completedSegments: 0,
    };
  },

  async analyzeShadowingSegment(params: {
    sessionId: string;
    segmentId: string;
    audioBlob: Blob;
    audioDurationMs?: number;
    originalText: string;
    recognizedText: string;
    lessonId: string;
    settings?: AppSettings;
  }): Promise<ShadowingAttempt> {
    const {
      sessionId,
      segmentId,
      audioBlob,
      audioDurationMs,
      originalText,
      recognizedText,
      settings,
    } = params;

    const userAudioUrl = URL.createObjectURL(audioBlob);

    // Word-level analysis is always computed locally from the REAL recognized text
    const wordResults = compareWords(originalText, recognizedText);

    // Try real AI for scoring; fall back to deterministic local scoring on failure
    let scoring = computeLocalScoring(recognizedText, wordResults);

    if (hasValidApiKey(settings) && recognizedText.trim()) {
      try {
        const aiEval = await evaluateShadowing(
          settings!,
          originalText,
          recognizedText,
          audioDurationMs
        );
        scoring = {
          finalScore: clamp(aiEval.finalScore),
          pronunciationScore: clamp(aiEval.pronunciationScore),
          completenessScore: clamp(aiEval.completenessScore),
          fluencyScore: clamp(aiEval.fluencyScore),
          rhythmScore: clamp(aiEval.rhythmScore),
          intonationScore: clamp(aiEval.intonationScore),
          feedback: aiEval.feedback || scoring.feedback,
        };
      } catch (e) {
        console.warn('AI shadowing evaluation failed, using local scoring:', e);
      }
    }

    return {
      id: generateId('attempt'),
      sessionId,
      segmentId,
      originalText,
      recognizedText,
      userAudioUrl,
      audioDurationMs,
      ...scoring,
      wordResults,
      createdAt: new Date().toISOString(),
    };
  },

  async getShadowingSessionResult(
    sessionId: string,
    segments: ShadowingSegment[]
  ): Promise<ShadowingSessionResult> {
    await delay(200);

    const attempted = segments.filter(
      s => s.status === 'completed' || s.status === 'need_retry'
    );
    const attempts = attempted
      .map(s => s.latestAttempt)
      .filter((a): a is ShadowingAttempt => a !== undefined);

    if (attempts.length === 0) {
      return {
        sessionId,
        lessonId: segments[0]?.lessonId ?? '',
        totalSegments: segments.length,
        completedSegments: 0,
        overallScore: 0,
        averagePronunciationScore: 0,
        averageCompletenessScore: 0,
        averageFluencyScore: 0,
        averageRhythmScore: 0,
        averageIntonationScore: 0,
        weakWords: [],
        weakSegments: [],
        bestSegments: [],
        segmentResults: [],
        aiSummaryFeedback:
          'Complete at least one segment to see your session summary.',
      };
    }

    const avg = (vals: number[]) =>
      Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);

    const overallScore = avg(attempts.map(a => a.finalScore));

    const segmentSummaries: ShadowingSegmentSummary[] = attempted
      .map(s => ({
        segmentId: s.id,
        order: s.order,
        text: s.text,
        finalScore: s.latestAttempt?.finalScore ?? 0,
        status: s.status as 'completed' | 'need_retry' | 'not_started',
      }))
      .sort((a, b) => a.order - b.order);

    const weakSegments = segmentSummaries
      .filter(s => s.finalScore < 70)
      .sort((a, b) => a.finalScore - b.finalScore)
      .slice(0, 5);

    const bestSegments = [...segmentSummaries]
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 3);

    const wordMap = new Map<string, WeakWord>();
    for (const attempt of attempts) {
      for (const wr of attempt.wordResults) {
        if (wr.status === 'wrong' || wr.status === 'weak_pronunciation') {
          const key = wr.word.toLowerCase();
          const existing = wordMap.get(key);
          if (existing) {
            existing.count++;
            if (!existing.examples.includes(attempt.originalText)) {
              existing.examples.push(attempt.originalText);
            }
          } else {
            wordMap.set(key, {
              word: wr.word,
              mistakeType: wr.status === 'wrong' ? 'consonant' : 'stress',
              count: 1,
              examples: [attempt.originalText],
            });
          }
        }
      }
    }

    const weakWords = Array.from(wordMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      sessionId,
      lessonId: segments[0]?.lessonId ?? '',
      totalSegments: segments.length,
      completedSegments: attempted.length,
      overallScore,
      averagePronunciationScore: avg(attempts.map(a => a.pronunciationScore)),
      averageCompletenessScore: avg(attempts.map(a => a.completenessScore)),
      averageFluencyScore: avg(attempts.map(a => a.fluencyScore)),
      averageRhythmScore: avg(attempts.map(a => a.rhythmScore)),
      averageIntonationScore: avg(attempts.map(a => a.intonationScore)),
      weakWords,
      weakSegments,
      bestSegments,
      segmentResults: attempts,
      aiSummaryFeedback: generateAISummary(
        overallScore,
        weakWords,
        attempted.length,
        segments.length
      ),
    };
  },
};

function generateAISummary(
  overallScore: number,
  weakWords: WeakWord[],
  completed: number,
  total: number
): string {
  const pct = Math.round((completed / total) * 100);
  const level =
    overallScore >= 85
      ? 'excellent'
      : overallScore >= 70
        ? 'good'
        : overallScore >= 55
          ? 'fair'
          : 'needs improvement';

  const weakStr =
    weakWords.length > 0
      ? ` Focus on improving: ${weakWords
          .slice(0, 3)
          .map(w => `"${w.word}"`)
          .join(', ')}.`
      : '';

  return `You completed ${completed}/${total} segments (${pct}%) with an overall score of ${overallScore}/100, which is ${level}.${weakStr} Keep practicing consistently to build confidence and fluency.`;
}
