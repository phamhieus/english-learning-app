// ── Shared scoring types (used by Part 1, 2, 3) ─────────────────────────────

export interface DetectedIssue {
  type: 'fluency' | 'vocabulary' | 'grammar' | 'pronunciation' | 'relevance' | 'structure' | 'coverage';
  originalText?: string;
  correctedText?: string;
  message: string;
}

export interface PronunciationWord {
  word: string;
  issue?: string;
}

export interface CoachingInsight {
  key: string;
  label: string;
  value?: string | number | boolean | null;
  message?: string;
}

// ── Part 1 ───────────────────────────────────────────────────────────────────

export type IeltsSpeakingMode =
  | 'full_mock_test'
  | 'practice_by_topic'
  | 'quick_practice'
  | 'random';

export type Part1QuestionType =
  | 'basic_information'
  | 'preference'
  | 'frequency'
  | 'description'
  | 'past_experience'
  | 'change_over_time'
  | 'future'
  | 'comparison';

export interface IeltsSpeakingQuestion {
  id: string;
  text: string;
  type?: Part1QuestionType;
  suggestedDurationSeconds?: number;
  answerFramework?: string[];
  vocabularyHints?: string[];
}

export interface IeltsSpeakingTopic {
  id: string;
  name: string;
  questions: IeltsSpeakingQuestion[];
}

export interface IeltsAnswerRecord {
  questionId: string;
  question: string;
  topicName: string;
  transcript: string;
  durationSeconds: number;
}

export interface IeltsSpeakingSessionInput {
  mode: IeltsSpeakingMode;
  topics: IeltsSpeakingTopic[];
  isMockMode: boolean;
}

export interface IeltsP1CriterionResult {
  estimatedBand: number | null;
  strengths: string[];
  issues: string[];
  usefulAlternatives?: string[];
  improvementTip?: string;
}

export interface IeltsP1QuestionResult {
  questionId: string;
  question: string;
  topicName: string;
  transcript: string;
  durationSeconds: number;
  quickScore: number | null;
  detectedIssues: DetectedIssue[];
  correctedTranscript: string;
  improvedAnswer: string;
  pronunciationWords: PronunciationWord[];
}

export interface IeltsP1SessionResult {
  sessionTitle: string;
  mode: IeltsSpeakingMode | string;
  durationSeconds: number;
  topicCount: number;
  questionCount: number;
  estimatedBand: number | null;
  disclaimer: string;
  criteria: {
    fluencyCoherence: IeltsP1CriterionResult;
    lexicalResource: IeltsP1CriterionResult;
    grammaticalRangeAccuracy: IeltsP1CriterionResult;
    pronunciation: IeltsP1CriterionResult;
  };
  coachingInsights: CoachingInsight[];
  questionResults: IeltsP1QuestionResult[];
  keyStrengths: string[];
  priorityImprovements: string[];
}

// ── Part 2 ───────────────────────────────────────────────────────────────────

export type Part2CueCardCategory =
  | 'people'
  | 'places'
  | 'objects'
  | 'experiences'
  | 'events'
  | 'activities'
  | 'education'
  | 'work'
  | 'technology'
  | 'travel'
  | 'culture'
  | 'daily_life';

export interface Part2RoundingOffQuestion {
  id: string;
  text: string;
}

export interface Part2CueCard {
  id: string;
  title: string;
  category: Part2CueCardCategory;
  prompt: string;
  bulletPoints: string[];
  explanationPrompt: string;
  roundingOffQuestions: Part2RoundingOffQuestion[];
  preparationFramework?: string[];
  vocabularyHints?: string[];
  sampleOutline?: string[];
}

export interface IeltsP2AnswerInput {
  questionId: string;
  question: string;
  transcript: string;
  durationSeconds: number;
  turnType: 'long_turn' | 'rounding_off';
}

export interface IeltsP2CriterionResult {
  estimatedBand: number;
  strengths: string[];
  issues: string[];
  improvementTip: string;
}

export interface IeltsP2CoachingInsight {
  key: string;
  label: string;
  message: string;
}

export interface IeltsP2SessionResult {
  sessionTitle: string;
  mode: string;
  durationSeconds: number;
  cueCardTitle: string;
  estimatedBand: number | null;
  criteria: {
    fluencyCoherence: IeltsP2CriterionResult;
    lexicalResource: IeltsP2CriterionResult;
    grammaticalRangeAccuracy: IeltsP2CriterionResult;
    pronunciation: IeltsP2CriterionResult;
  };
  coachingInsights: IeltsP2CoachingInsight[];
  longTurnResult: {
    transcript: string;
    durationSeconds: number;
    quickScore: number | null;
    correctedTranscript: string;
    improvedAnswer: string;
    detectedIssues: string[];
  };
  roundingOffResults: {
    questionId: string;
    question: string;
    transcript: string;
    durationSeconds: number;
    quickScore: number | null;
    correctedTranscript: string;
    improvedAnswer: string;
  }[];
  keyStrengths: string[];
  priorityImprovements: string[];
}

// ── Part 3 ───────────────────────────────────────────────────────────────────

export type Part3QuestionType =
  | 'opinion'
  | 'reason'
  | 'cause_effect'
  | 'comparison'
  | 'change_over_time'
  | 'advantages_disadvantages'
  | 'problem_solution'
  | 'prediction'
  | 'evaluation'
  | 'speculation';

export interface Part3Question {
  id: string;
  text: string;
  type: Part3QuestionType;
  answerFramework?: string[];
  vocabularyHints?: string[];
}

export interface Part3DiscussionSet {
  id: string;
  title: string;
  theme: string;
  linkedPart2CueCardIds: string[];
  questions: Part3Question[];
}

export interface IeltsP3AnswerInput {
  questionId: string;
  question: string;
  transcript: string;
  durationSeconds: number;
}

export interface IeltsP3CriterionResult {
  estimatedBand: number;
  strengths: string[];
  issues: string[];
  improvementTip: string;
}

export interface IeltsP3CoachingInsight {
  key: string;
  label: string;
  message: string;
}

export interface IeltsP3QuestionResult {
  questionId: string;
  question: string;
  transcript: string;
  durationSeconds: number;
  quickScore: number | null;
  correctedTranscript: string;
  improvedAnswer: string;
  detectedIssues: string[];
}

export interface IeltsP3SessionResult {
  sessionTitle: string;
  mode: string;
  durationSeconds: number;
  discussionTheme: string;
  estimatedBand: number | null;
  criteria: {
    fluencyCoherence: IeltsP3CriterionResult;
    lexicalResource: IeltsP3CriterionResult;
    grammaticalRangeAccuracy: IeltsP3CriterionResult;
    pronunciation: IeltsP3CriterionResult;
  };
  coachingInsights: IeltsP3CoachingInsight[];
  questionResults: IeltsP3QuestionResult[];
  keyStrengths: string[];
  priorityImprovements: string[];
}
