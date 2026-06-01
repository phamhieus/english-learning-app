export interface PictureDescriptionFeedback {
  score: number;
  contentScore: number;
  vocabularyScore: number;
  grammarScore: number;
  fluencyScore: number;
  feedback: string;
  keyElementsMissed: string[];
  improvementTips: string[];
  sampleDescription: string;
}

export interface PictureDescriptionPractice {
  id: number;
  title: string;
  imageUrl: string;
  level: string;
  duration: string;
  category: string;
}
