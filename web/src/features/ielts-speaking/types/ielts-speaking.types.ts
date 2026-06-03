export type IeltsSpeakingMode =
  | 'full_mock_test'
  | 'practice_by_topic'
  | 'quick_practice'
  | 'random';

export interface IeltsSpeakingQuestion {
  id: string;
  text: string;
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
  estimatedBand: number;
  strengths: string[];
  issues: string[];
  usefulAlternatives?: string[];
  improvementTip: string;
}

export interface IeltsP1QuestionResult {
  questionId: string;
  question: string;
  topicName: string;
  transcript: string;
  durationSeconds: number;
  quickScore: number;
  detectedIssues: string[];
  correctedTranscript: string;
  improvedAnswer: string;
  pronunciationWords: string[];
}

export interface IeltsP1SessionResult {
  sessionTitle: string;
  mode: IeltsSpeakingMode;
  durationSeconds: number;
  topicCount: number;
  questionCount: number;
  estimatedBand: number;
  criteria: {
    fluencyCoherence: IeltsP1CriterionResult;
    lexicalResource: IeltsP1CriterionResult;
    grammaticalRangeAccuracy: IeltsP1CriterionResult;
    pronunciation: IeltsP1CriterionResult;
  };
  questionResults: IeltsP1QuestionResult[];
  keyStrengths: string[];
  priorityImprovements: string[];
}
