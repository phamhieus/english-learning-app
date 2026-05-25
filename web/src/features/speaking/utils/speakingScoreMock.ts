import type { SpeakingAnalysisResult, SpeakingIssue, SpeakingTranscript } from "../types/speaking.types";
import { alignWords, normalizeText } from "./transcriptDiff";

export function generateMockScore(
  targetText: string | undefined,
  recognizedText: string,
  durationSeconds: number,
  source: "whisper"
): SpeakingAnalysisResult {
  const normTarget = normalizeText(targetText || "");
  const normRecognized = normalizeText(recognizedText);

  const targetWords = normTarget ? normTarget.split(" ") : [];
  const recognizedWords = normRecognized ? normRecognized.split(" ") : [];

  // 1. Calculate Pronunciation Score
  let pronunciationScore = 80;
  const issues: SpeakingIssue[] = [];
  const feedback: string[] = [];

  if (targetText && targetWords.length > 0) {
    const diff = alignWords(targetText, recognizedText);
    const correctCount = diff.filter((d) => d.type === "correct").length;

    // Deduct points
    const totalWords = targetWords.length;
    const baseScore = (correctCount / totalWords) * 100;
    pronunciationScore = Math.max(10, Math.round(baseScore));

    // Populate word issues
    diff.forEach((item) => {
      if (item.type === "missing") {
        issues.push({
          type: "missing_word",
          severity: "high",
          word: item.text,
          message: `Từ "${item.text}" bị bỏ sót.`,
        });
      } else if (item.type === "substituted") {
        issues.push({
          type: "substituted_word",
          severity: "medium",
          word: item.text,
          message: `Từ "${item.text}" phát âm không chính xác (nhận diện thành "${item.matchedWith}").`,
        });
      }
    });

    if (pronunciationScore > 85) {
      feedback.push("Bạn nói khá rõ và đầy đủ nội dung mẫu.");
    } else if (pronunciationScore < 50) {
      feedback.push("Bạn có thể đã bỏ sót một số từ trong câu mẫu hoặc phát âm chưa rõ.");
    }
  } else {
    // Free speaking or empty target text
    if (recognizedWords.length === 0) {
      pronunciationScore = 10;
    } else {
      pronunciationScore = Math.min(95, 60 + recognizedWords.length * 2);
    }
    feedback.push("Nội dung được ghi nhận. Hệ thống phân tích độ mượt mà dựa trên số lượng từ.");
  }

  // 2. Fluency Score (WPM)
  let wpm = 0;
  let fluencyScore = 80;
  if (durationSeconds > 0) {
    wpm = Math.round((recognizedWords.length / durationSeconds) * 60);
    if (wpm < 80) {
      fluencyScore = Math.max(40, wpm);
      issues.push({
        type: "speaking_too_slow",
        severity: "medium",
        message: `Tốc độ nói khá chậm (${wpm} từ/phút).`,
      });
      feedback.push("Bạn nói hơi chậm, hãy luyện nói liền mạch hơn.");
    } else if (wpm > 160) {
      fluencyScore = 70;
      issues.push({
        type: "speaking_too_fast",
        severity: "low",
        message: `Tốc độ nói khá nhanh (${wpm} từ/phút).`,
      });
      feedback.push("Bạn nói hơi nhanh, hãy giảm tốc độ để phát âm rõ hơn.");
    } else {
      fluencyScore = 95;
    }
  } else {
    fluencyScore = 10;
  }

  // 3. Rhythm, Intonation, Stress
  const rhythmScore = 75;
  const intonationScore = 70;
  const stressScore = 70;

  issues.push({
    type: "placeholder_prosody",
    severity: "low",
    message: "Ngữ điệu và nhấn nhá hiện đang là đánh giá cơ bản.",
  });
  feedback.push("Phần ngữ điệu, nhịp nói và nhấn nhá hiện đang là đánh giá cơ bản. Có thể phân tích sâu hơn khi tích hợp prosody engine sau.");

  // 4. Overall Score
  const overallScore = Math.round(
    pronunciationScore * 0.3 +
    fluencyScore * 0.25 +
    rhythmScore * 0.2 +
    intonationScore * 0.15 +
    stressScore * 0.1
  );

  return {
    overallScore,
    pronunciationScore,
    fluencyScore,
    rhythmScore,
    intonationScore,
    stressScore,
    targetText,
    recognizedText,
    transcript: { text: recognizedText, isFinal: true, segments: [] } as SpeakingTranscript,
    prosody: {
      totalDurationSeconds: durationSeconds,
      speakingRateWpm: wpm,
      finalTone: "unknown",
      isPlaceholder: true,
    },
    issues,
    feedback,
    source,
  };
}
