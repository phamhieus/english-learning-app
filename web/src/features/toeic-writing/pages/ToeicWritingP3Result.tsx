import { ArrowLeft, ArrowRight, Clock, RotateCcw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../../components/classNames';
import type { FeedbackResult } from '../../feedback/types/feedback.types';
import { TeacherCommentCard } from '../../feedback/components/TeacherCommentCard';
import { ScoreBreakdownSection } from '../../feedback/components/ScoreBreakdownSection';
import { AnswerReviewPanel } from '../../feedback/components/AnswerReviewPanel';
import { ImprovedSampleCard } from '../../feedback/components/ImprovedSampleCard';
import { RecommendedPracticeCard } from '../../feedback/components/RecommendedPracticeCard';
import type { Practice } from '../../../services/storage';

// 0-5 TOEIC essay band → colour. Distinct from IELTS band thresholds so the
// TOEIC grading reads on its own terms.
const bandGradient = (score: number): string => {
  if (score >= 4) return 'from-emerald-500 to-teal-500';
  if (score >= 3) return 'from-blue-500 to-indigo-500';
  if (score >= 2) return 'from-amber-500 to-orange-500';
  return 'from-rose-500 to-red-500';
};

const ToeicWritingP3Result = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { result?: FeedbackResult; practice?: Practice } | null) ?? null;
  const result = state?.result ?? null;

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          No feedback found. Please complete a Part 3 essay first.
        </p>
        <button
          onClick={() => navigate('/writing/toeic-p3')}
          className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Back to Part 3
        </button>
      </div>
    );
  }

  const score = typeof result.overallScore === 'number' ? Math.max(0, Math.min(5, result.overallScore)) : null;
  const issues = result.issues ?? [];
  const criteria = result.criteria ?? [];
  const dateStr = new Date(result.createdAt ?? Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const retry = () => navigate('/writing/toeic-p3/session', { state: { practice: state?.practice } });
  const next = () => navigate('/writing/toeic-p3');

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400 pb-16">
      {/* TOEIC-branded header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white shadow-2xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-white/50 bg-white/10 px-3 py-1 rounded-full">
              TOEIC Writing · Part 3
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
            <div className={cn(
              'flex-shrink-0 w-24 h-24 rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center shadow-lg',
              bandGradient(score ?? 0),
            )}>
              <span className="text-3xl font-black leading-none">{score ?? '–'}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 mt-0.5">/ 5 band</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">{result.scoreLabel ?? '—'}</h1>
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Clock className="w-3.5 h-3.5" /> {dateStr}
              </div>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={retry}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Write Again
            </button>
            <button
              onClick={next}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-white/90 text-sm font-semibold transition-colors"
            >
              Next Prompt <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {(result.teacherComment || (result.strengths?.length ?? 0) > 0 || (result.topPriorities?.length ?? 0) > 0) && (
        <TeacherCommentCard
          comment={result.teacherComment ?? ''}
          strengths={result.strengths ?? []}
          topPriorities={result.topPriorities ?? []}
        />
      )}

      {criteria.length > 0 && <ScoreBreakdownSection criteria={criteria} issues={issues} />}

      {(result.originalAnswer || issues.length > 0) && (
        <AnswerReviewPanel originalAnswer={result.originalAnswer} issues={issues} />
      )}

      {result.improvedSample && <ImprovedSampleCard sample={result.improvedSample} label="Band 5 Model Essay" />}

      {(result.recommendedPractice?.length ?? 0) > 0 && (
        <RecommendedPracticeCard practices={result.recommendedPractice!} onNavigate={navigate} />
      )}
    </div>
  );
};

export default ToeicWritingP3Result;
