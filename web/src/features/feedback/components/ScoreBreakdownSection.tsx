import { BarChart3 } from 'lucide-react';
import type { CriterionFeedback, FeedbackIssue } from '../types/feedback.types';
import { CriterionFeedbackAccordion } from './CriterionFeedbackAccordion';

interface ScoreBreakdownSectionProps {
  criteria: CriterionFeedback[];
  issues: FeedbackIssue[];
  onIssueClick?: (issue: FeedbackIssue) => void;
}

export function ScoreBreakdownSection({ criteria, issues, onIssueClick }: ScoreBreakdownSectionProps) {
  if (criteria.length === 0) return null;

  const issuesByCriterion = (criterionId: string): FeedbackIssue[] =>
    issues.filter(i => i.criterionId === criterionId);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-slate-500" />
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Score Breakdown</h2>
        <span className="text-xs text-slate-400 ml-1">— click a criterion to expand</span>
      </div>
      <div className="space-y-3">
        {criteria.map((criterion, i) => (
          <CriterionFeedbackAccordion
            key={criterion.id}
            criterion={criterion}
            issues={issuesByCriterion(criterion.id)}
            onIssueClick={onIssueClick}
            defaultOpen={i === 0}
          />
        ))}
      </div>
    </div>
  );
}
