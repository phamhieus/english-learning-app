export interface DiffItem {
  type: "correct" | "missing" | "extra" | "substituted";
  text: string;
  matchedWith?: string;
}

export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Align target text with recognized text at the word level using Needleman-Wunsch.
 */
export function alignWords(target: string, recognized: string): DiffItem[] {
  const targetNorm = normalizeText(target);
  const recognizedNorm = normalizeText(recognized);

  const tWords = targetNorm ? targetNorm.split(" ") : [];
  const rWords = recognizedNorm ? recognizedNorm.split(" ") : [];

  const M = tWords.length;
  const N = rWords.length;

  if (M === 0) {
    return rWords.map((w) => ({ type: "extra" as const, text: w }));
  }
  if (N === 0) {
    return tWords.map((w) => ({ type: "missing" as const, text: w }));
  }

  // Cost: Substitution=3, Deletion=2, Insertion=2, Match=0
  const dp: number[][] = Array.from({ length: M + 1 }, () => Array(N + 1).fill(0));

  for (let i = 0; i <= M; i++) dp[i][0] = i * 2;
  for (let j = 0; j <= N; j++) dp[0][j] = j * 2;

  for (let i = 1; i <= M; i++) {
    for (let j = 1; j <= N; j++) {
      const matchCost = tWords[i - 1] === rWords[j - 1] ? 0 : 3;
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + matchCost, // Substitution / Match
        dp[i - 1][j] + 2,             // Deletion (missing)
        dp[i][j - 1] + 2              // Insertion (extra)
      );
    }
  }

  // Backtracking to find alignment path
  let i = M;
  let j = N;
  const result: DiffItem[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const matchCost = tWords[i - 1] === rWords[j - 1] ? 0 : 3;
      if (dp[i][j] === dp[i - 1][j - 1] + matchCost) {
        if (matchCost === 0) {
          result.push({ type: "correct", text: tWords[i - 1] });
        } else {
          result.push({
            type: "substituted",
            text: tWords[i - 1],
            matchedWith: rWords[j - 1],
          });
        }
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 2)) {
      result.push({ type: "missing", text: tWords[i - 1] });
      i--;
    } else {
      result.push({ type: "extra", text: rWords[j - 1] });
      j--;
    }
  }

  return result.reverse();
}
