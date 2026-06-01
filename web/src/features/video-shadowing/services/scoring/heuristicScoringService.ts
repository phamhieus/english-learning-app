// MVP rule-based scoring. NOT phoneme-level pronunciation assessment — the
// "pronunciation" number is an approximation derived from word-match accuracy.
// Implements ShadowingScoringService so a real engine can replace it later
// without touching the UI.

import { toWords } from '../../utils/textNormalizer';
import type {
  ScoreAttemptInput,
  ShadowingScoreResult,
  ShadowingScoringService,
} from '../../models/scoring';

/** Longest common subsequence length (token-level), for order-aware matching. */
function lcsLength(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  if (m === 0 || n === 0) return 0;
  let prev = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    const curr = new Array<number>(n + 1).fill(0);
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], curr[j - 1]);
    }
    prev = curr;
  }
  return prev[n];
}

function multisetDiff(reference: string[], spoken: string[]): { missing: string[]; extra: string[] } {
  const refCount = new Map<string, number>();
  for (const w of reference) refCount.set(w, (refCount.get(w) ?? 0) + 1);
  const spokenCount = new Map<string, number>();
  for (const w of spoken) spokenCount.set(w, (spokenCount.get(w) ?? 0) + 1);

  const missing: string[] = [];
  for (const [w, c] of refCount) {
    const got = spokenCount.get(w) ?? 0;
    for (let i = 0; i < c - got; i++) missing.push(w);
  }
  const extra: string[] = [];
  for (const [w, c] of spokenCount) {
    const want = refCount.get(w) ?? 0;
    for (let i = 0; i < c - want; i++) extra.push(w);
  }
  return { missing: dedupeKeepOrder(missing), extra: dedupeKeepOrder(extra) };
}

function dedupeKeepOrder(words: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (!seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export class HeuristicScoringService implements ShadowingScoringService {
  async scoreAttempt(input: ScoreAttemptInput): Promise<ShadowingScoreResult> {
    const refWords = toWords(input.referenceText);
    const spokenWords = toWords(input.recognizedText);

    const { missing, extra } = multisetDiff(refWords, spokenWords);
    const matched = lcsLength(refWords, spokenWords);
    const wordMatchRatio = refWords.length ? matched / refWords.length : 0;

    // Completion: how much of the reference was reproduced, in order.
    const completionScore = clamp(wordMatchRatio * 100);

    // Rhythm: closeness of attempt length to the original segment length.
    const durRatio =
      input.segmentDurationMs > 0 ? input.attemptDurationMs / input.segmentDurationMs : 1;
    const rhythmScore = clamp(100 - Math.min(60, Math.abs(durRatio - 1) * 100));

    // Fluency: blends accuracy with pacing, penalizes extra (stumbling) words.
    const extraPenalty = refWords.length ? Math.min(25, (extra.length / refWords.length) * 100) : 0;
    const fluencyScore = clamp(wordMatchRatio * 80 + rhythmScore * 0.2 - extraPenalty);

    // Pronunciation (heuristic approximation only).
    const pronunciationScore = clamp(wordMatchRatio * 90 + 5);

    const totalScore = clamp(
      completionScore * 0.4 + pronunciationScore * 0.3 + fluencyScore * 0.2 + rhythmScore * 0.1,
    );

    const rating: ShadowingScoreResult['rating'] =
      totalScore >= 85 ? 'good' : totalScore >= 70 ? 'ok' : 'retry';

    return {
      totalScore,
      completionScore,
      fluencyScore,
      rhythmScore,
      pronunciationScore,
      missingWords: missing,
      extraWords: extra,
      // Without phonemes we surface the missing words as the actionable set.
      mispronouncedWords: [],
      wordMatchRatio,
      feedback: buildFeedback({ rating, missing, extra, durRatio }),
      rating,
    };
  }
}

function buildFeedback(args: {
  rating: 'good' | 'ok' | 'retry';
  missing: string[];
  extra: string[];
  durRatio: number;
}): string {
  const parts: string[] = [];
  if (args.rating === 'good') parts.push('Rất tốt! Phát âm rõ ràng và đầy đủ.');
  else if (args.rating === 'ok') parts.push('Khá ổn — gần đạt rồi.');
  else parts.push('Cần luyện thêm câu này.');

  if (args.missing.length) {
    parts.push(`Bạn bỏ sót: ${args.missing.slice(0, 3).join(', ')}.`);
  }
  if (args.durRatio > 1.3) parts.push('Bạn đọc hơi chậm — thử bám nhịp người nói.');
  else if (args.durRatio < 0.7) parts.push('Bạn đọc hơi nhanh — chậm lại một chút nhé.');

  return parts.join(' ');
}

export const heuristicScoringService = new HeuristicScoringService();
