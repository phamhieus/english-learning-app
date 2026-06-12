import { useNavigate, useLocation } from 'react-router-dom';
import type { FeedbackResult, FeedbackIssue } from './types/feedback.types';
import { MODULE_CONFIG } from './types/feedback.types';
import { ResultHeader } from './components/ResultHeader';
import { TeacherCommentCard } from './components/TeacherCommentCard';
import { ScoreBreakdownSection } from './components/ScoreBreakdownSection';
import { AnswerReviewPanel } from './components/AnswerReviewPanel';
import { ImprovedSampleCard } from './components/ImprovedSampleCard';
import { RecommendedPracticeCard } from './components/RecommendedPracticeCard';
import { AudioAnalysisCard } from './components/AudioAnalysisCard';

interface FeedbackResultPageProps {
  /** Pass directly when embedded in another screen */
  result?: FeedbackResult;
  /** Retry handler — overrides config.retryRoute */
  onRetry?: () => void;
  /** Next handler — overrides config.nextRoute */
  onNext?: () => void;
}

/**
 * Validates the AI-returned FeedbackResult and returns a list of missing
 * required fields. A partial result is still rendered — we never crash.
 */
function validateResult(r: Partial<FeedbackResult>): string[] {
  const missing: string[] = [];
  if (!r.module) missing.push('module');
  if (!r.scoreLabel) missing.push('scoreLabel');
  if (!r.teacherComment) missing.push('teacherComment');
  return missing;
}

export function FeedbackResultPage({ result: propResult, onRetry, onNext }: FeedbackResultPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Accept result from props (embedded) or from router state (standalone route)
  const result: Partial<FeedbackResult> | null = propResult ?? (location.state as { result: FeedbackResult } | null)?.result ?? null;

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-slate-500 dark:text-slate-400">No feedback data found. Please complete a practice session first.</p>
        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2.5 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors">
          Go to Dashboard
        </button>
      </div>
    );
  }

  const missing = validateResult(result);
  if (missing.length > 0) {
    console.warn('[FeedbackResultPage] Missing fields from AI response:', missing);
  }

  const config = result.module ? MODULE_CONFIG[result.module] : undefined;
  const defaultConfig = {
    module: result.module ?? 'ielts-writing-task-1',
    label: result.module ?? 'Practice Result',
    showBandScore: true,
    showTranscript: false,
    showAudioAnalysis: false,
    showImprovedSample: true,
    retryRoute: '/',
    nextRoute: '/',
    scoreUnit: 'band' as const,
  };
  const cfg = config ?? defaultConfig;

  const handleRetry = () => {
    if (onRetry) { onRetry(); return; }
    navigate(cfg.retryRoute, { state: location.state });
  };

  const handleNext = () => {
    if (onNext) { onNext(); return; }
    navigate(cfg.nextRoute);
  };

  const handleBack = () => navigate(-1);

  const handleIssueClick = (_issue: FeedbackIssue) => {
    // Future: scroll to highlighted text in AnswerReviewPanel
  };

  const issues = result.issues ?? [];
  const criteria = result.criteria ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400 pb-16">
      {/* Validation warning for developers */}
      {missing.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          <span className="font-bold">Dev notice:</span> AI response missing fields: {missing.join(', ')}. Showing available data.
        </div>
      )}

      {/* 1. Header */}
      <ResultHeader
        config={cfg}
        scoreLabel={result.scoreLabel ?? '—'}
        overallScore={result.overallScore}
        createdAt={result.createdAt ?? new Date().toISOString()}
        onRetry={handleRetry}
        onNext={handleNext}
        onBack={handleBack}
      />

      {/* 2. Teacher comment + strengths + priorities */}
      {(result.teacherComment || (result.strengths?.length ?? 0) > 0 || (result.topPriorities?.length ?? 0) > 0) && (
        <TeacherCommentCard
          comment={result.teacherComment ?? ''}
          strengths={result.strengths ?? []}
          topPriorities={result.topPriorities ?? []}
        />
      )}

      {/* 3. Score breakdown */}
      {criteria.length > 0 && (
        <ScoreBreakdownSection
          criteria={criteria}
          issues={issues}
          onIssueClick={handleIssueClick}
        />
      )}

      {/* 4. Audio analysis (speaking/shadowing) */}
      {cfg.showAudioAnalysis && result.audioAnalysis && (
        <AudioAnalysisCard analysis={result.audioAnalysis} />
      )}

      {/* 5. Answer review with inline highlights */}
      {(result.originalAnswer || result.transcript || issues.length > 0) && (
        <AnswerReviewPanel
          originalAnswer={result.originalAnswer}
          transcript={result.transcript}
          issues={issues}
          onIssueClick={handleIssueClick}
        />
      )}

      {/* 6. Improved sample */}
      {cfg.showImprovedSample && result.improvedSample && (
        <ImprovedSampleCard sample={result.improvedSample} />
      )}

      {/* 7. Recommended practice */}
      {(result.recommendedPractice?.length ?? 0) > 0 && (
        <RecommendedPracticeCard
          practices={result.recommendedPractice!}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}
