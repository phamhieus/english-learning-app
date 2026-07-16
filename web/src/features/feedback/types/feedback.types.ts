// ─── Module identifiers ────────────────────────────────────────────────────────
export type FeedbackModule =
  | 'ielts-writing-task-1'
  | 'ielts-writing-task-2'
  | 'toeic-writing-essay'
  | 'toeic-writing-picture'
  | 'toeic-writing-request'
  | 'ielts-speaking'
  | 'toeic-speaking-read-aloud'
  | 'toeic-speaking-picture-description'
  | 'toeic-speaking-respond-to-question'
  | 'toeic-speaking-use-information'
  | 'toeic-speaking-opinion'
  | 'shadowing'
  | 'virtual-conversation';

export type Severity = 'high' | 'medium' | 'low';
export type IssueGroup = 'must-fix' | 'nice-to-improve';

// ─── Core result shape ─────────────────────────────────────────────────────────
export interface FeedbackResult {
  id: string;
  module: FeedbackModule;
  /** Numeric score — 0-100 for general, 0-9 for IELTS band, percentage for shadowing */
  overallScore?: number;
  /** Human-readable label: "Band 5.5", "78%", "160/200" */
  scoreLabel: string;
  teacherComment: string;
  strengths: string[];
  topPriorities: FeedbackPriority[];
  criteria: CriterionFeedback[];
  issues: FeedbackIssue[];
  /** The learner's original written answer */
  originalAnswer?: string;
  /** The learner's spoken transcript */
  transcript?: string;
  improvedSample?: string;
  recommendedPractice?: RecommendedPractice[];
  audioAnalysis?: AudioAnalysis;
  createdAt: string;
}

// ─── Top priorities ───────────────────────────────────────────────────────────
export interface FeedbackPriority {
  title: string;
  description: string;
  relatedIssueIds: string[];
}

// ─── Per-criterion breakdown ──────────────────────────────────────────────────
export interface CriterionFeedback {
  id: string;
  name: string;
  score?: number;
  scoreLabel: string;
  summary: string;
  whyThisScore: string;
  strengths: string[];
  issueIds: string[];
  /** What the learner needs to do to reach the next band/level */
  nextBandTarget?: string;
}

// ─── Individual issues ────────────────────────────────────────────────────────
export interface FeedbackIssue {
  id: string;
  criterionId?: string;
  group: IssueGroup;
  severity: Severity;
  type: string;
  title: string;
  /** Exact excerpt from learner's answer */
  originalText?: string;
  suggestedRevision?: string;
  explanation: string;
  impactOnScore?: string;
  /** Character offsets into originalAnswer/transcript for highlight mapping */
  startIndex?: number;
  endIndex?: number;
  /** Seconds into audio for spoken issues */
  timestampStart?: number;
  timestampEnd?: number;
}

// ─── Recommended next steps ───────────────────────────────────────────────────
export interface RecommendedPractice {
  title: string;
  description: string;
  activityType?: FeedbackModule;
}

// ─── Audio / pronunciation analysis ──────────────────────────────────────────
export interface AudioAnalysis {
  durationSeconds?: number;
  speakingRateWpm?: number;
  longPauseCount?: number;
  fillerWords?: Record<string, number>;
  missingWords?: string[];
  addedWords?: string[];
  mispronouncedWords?: PronunciationIssue[];
  rhythmComment?: string;
  intonationComment?: string;
}

export interface PronunciationIssue {
  word: string;
  expectedPronunciation?: string;
  detectedProblem: string;
  timestampStart?: number;
  timestampEnd?: number;
  suggestedPractice?: string;
}

// ─── Module config (controls which sections render) ──────────────────────────
export interface FeedbackModuleConfig {
  module: FeedbackModule;
  label: string;
  showBandScore: boolean;
  showTranscript: boolean;
  showAudioAnalysis: boolean;
  showImprovedSample: boolean;
  retryRoute: string;
  nextRoute: string;
  scoreUnit: 'band' | 'percent' | 'toeic' | 'score';
}

export const MODULE_CONFIG: Record<FeedbackModule, FeedbackModuleConfig> = {
  'ielts-writing-task-1': {
    module: 'ielts-writing-task-1',
    label: 'IELTS Writing Task 1',
    showBandScore: true,
    showTranscript: false,
    showAudioAnalysis: false,
    showImprovedSample: true,
    retryRoute: '/writing/editor',
    nextRoute: '/writing',
    scoreUnit: 'band',
  },
  'ielts-writing-task-2': {
    module: 'ielts-writing-task-2',
    label: 'IELTS Writing Task 2',
    showBandScore: true,
    showTranscript: false,
    showAudioAnalysis: false,
    showImprovedSample: true,
    retryRoute: '/writing/editor',
    nextRoute: '/writing',
    scoreUnit: 'band',
  },
  'toeic-writing-essay': {
    module: 'toeic-writing-essay',
    label: 'TOEIC Writing · Opinion Essay',
    showBandScore: false,
    showTranscript: false,
    showAudioAnalysis: false,
    showImprovedSample: true,
    retryRoute: '/writing/toeic-p3/session',
    nextRoute: '/writing/toeic-p3',
    scoreUnit: 'toeic',
  },
  'toeic-writing-picture': {
    module: 'toeic-writing-picture',
    label: 'TOEIC Writing · Describe a Picture',
    showBandScore: false,
    showTranscript: false,
    showAudioAnalysis: false,
    showImprovedSample: true,
    retryRoute: '/writing/editor',
    nextRoute: '/writing',
    scoreUnit: 'score',
  },
  'toeic-writing-request': {
    module: 'toeic-writing-request',
    label: 'TOEIC Writing · Respond to a Request',
    showBandScore: false,
    showTranscript: false,
    showAudioAnalysis: false,
    showImprovedSample: true,
    retryRoute: '/writing/editor',
    nextRoute: '/writing',
    scoreUnit: 'score',
  },
  'ielts-speaking': {
    module: 'ielts-speaking',
    label: 'IELTS Speaking',
    showBandScore: true,
    showTranscript: true,
    showAudioAnalysis: true,
    showImprovedSample: false,
    retryRoute: '/speaking/ielts',
    nextRoute: '/speaking/ielts',
    scoreUnit: 'band',
  },
  'toeic-speaking-read-aloud': {
    module: 'toeic-speaking-read-aloud',
    label: 'TOEIC Speaking · Read Aloud',
    showBandScore: false,
    showTranscript: true,
    showAudioAnalysis: true,
    showImprovedSample: false,
    retryRoute: '/speaking/record',
    nextRoute: '/speaking',
    scoreUnit: 'score',
  },
  'toeic-speaking-picture-description': {
    module: 'toeic-speaking-picture-description',
    label: 'TOEIC Speaking · Picture Description',
    showBandScore: false,
    showTranscript: true,
    showAudioAnalysis: false,
    showImprovedSample: true,
    retryRoute: '/speaking/picture/practice',
    nextRoute: '/speaking/picture',
    scoreUnit: 'score',
  },
  'toeic-speaking-respond-to-question': {
    module: 'toeic-speaking-respond-to-question',
    label: 'TOEIC Speaking · Respond to Questions',
    showBandScore: false,
    showTranscript: true,
    showAudioAnalysis: false,
    showImprovedSample: true,
    retryRoute: '/speaking/record',
    nextRoute: '/speaking',
    scoreUnit: 'score',
  },
  'toeic-speaking-use-information': {
    module: 'toeic-speaking-use-information',
    label: 'TOEIC Speaking · Use Information',
    showBandScore: false,
    showTranscript: true,
    showAudioAnalysis: false,
    showImprovedSample: true,
    retryRoute: '/speaking/record',
    nextRoute: '/speaking',
    scoreUnit: 'score',
  },
  'toeic-speaking-opinion': {
    module: 'toeic-speaking-opinion',
    label: 'TOEIC Speaking · Express an Opinion',
    showBandScore: false,
    showTranscript: true,
    showAudioAnalysis: false,
    showImprovedSample: true,
    retryRoute: '/speaking/record',
    nextRoute: '/speaking',
    scoreUnit: 'score',
  },
  shadowing: {
    module: 'shadowing',
    label: 'Shadowing Practice',
    showBandScore: false,
    showTranscript: true,
    showAudioAnalysis: true,
    showImprovedSample: false,
    retryRoute: '/shadowing/practice',
    nextRoute: '/shadowing',
    scoreUnit: 'percent',
  },
  'virtual-conversation': {
    module: 'virtual-conversation',
    label: 'Virtual Conversation',
    showBandScore: false,
    showTranscript: true,
    showAudioAnalysis: false,
    showImprovedSample: true,
    retryRoute: '/shadowing/virtual-conversation',
    nextRoute: '/shadowing/virtual-conversation',
    scoreUnit: 'score',
  },
};
