import { ArrowRight, BookOpen } from 'lucide-react';
import type { RecommendedPractice, FeedbackModule } from '../types/feedback.types';
import { MODULE_CONFIG } from '../types/feedback.types';

interface RecommendedPracticeCardProps {
  practices: RecommendedPractice[];
  onNavigate?: (route: string) => void;
}

const moduleLabel = (m?: FeedbackModule): string => (m ? MODULE_CONFIG[m]?.label ?? m : '');
const moduleRoute = (m?: FeedbackModule): string => (m ? MODULE_CONFIG[m]?.nextRoute ?? '/' : '/');

export function RecommendedPracticeCard({ practices, onNavigate }: RecommendedPracticeCardProps) {
  if (practices.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-indigo-500" />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Recommended Next Steps
        </span>
      </div>
      <div className="space-y-3">
        {practices.map((p, i) => (
          <div key={i} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{p.title}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.description}</div>
              {p.activityType && (
                <div className="text-[10px] text-indigo-500 mt-1 font-medium">{moduleLabel(p.activityType)}</div>
              )}
            </div>
            {p.activityType && onNavigate && (
              <button
                onClick={() => onNavigate(moduleRoute(p.activityType))}
                className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors"
              >
                Go <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
