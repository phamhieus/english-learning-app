/**
 * TOEIC Writing Questions 1-5 — "Write a Sentence Based on a Picture".
 * The candidate writes ONE sentence about a picture and MUST use the two
 * given words/phrases (forms and order may be changed).
 */
export interface SentenceWritingPractice {
  id: number;
  /** Short description of the scene — used as the image alt and AI context. */
  title: string;
  imageUrl: string;
  /** Optional small preview; when absent it is derived from `imageUrl`. */
  thumbnailUrl?: string;
  level: string;
  category: string;
  /** The two words/phrases that must appear in the candidate's sentence. */
  words: [string, string];
  duration: string;
}

export interface SentenceWritingFeedback {
  /** Overall 0-100 score (mapped from the official 0-3 scale). */
  score: number;
  /** Official TOEIC Q1-5 score: 0, 1, 2 or 3. */
  toeicScore: number;
  grammarScore: number;
  relevanceScore: number;
  /** Whether each given word/phrase was used (in any valid form). */
  usedWord1: boolean;
  usedWord2: boolean;
  /** 2-3 sentences of overall feedback. */
  feedback: string;
  /** The candidate's sentence rewritten correctly (empty if already perfect). */
  correctedSentence: string;
  /** A model high-scoring sentence for this picture. */
  sampleSentence: string;
  improvementTips: string[];
}
