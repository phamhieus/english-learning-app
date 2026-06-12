import { Sparkles, Star, Target } from 'lucide-react';
import type { FeedbackPriority } from '../types/feedback.types';

interface TeacherCommentCardProps {
  comment: string;
  strengths: string[];
  topPriorities: FeedbackPriority[];
}

export function TeacherCommentCard({ comment, strengths, topPriorities }: TeacherCommentCardProps) {
  return (
    <div className="space-y-4">
      {/* Teacher comment */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border-l-4 border-indigo-500">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
            Teacher's Comment
          </span>
        </div>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{comment}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="glass-card rounded-2xl p-5 border border-emerald-200 dark:border-emerald-900/40">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">What you did well</span>
            </div>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    ✓
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Top priorities */}
        {topPriorities.length > 0 && (
          <div className="glass-card rounded-2xl p-5 border border-orange-200 dark:border-orange-900/40">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-700 dark:text-orange-400">Top Priorities</span>
            </div>
            <ol className="space-y-3">
              {topPriorities.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{p.title}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{p.description}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
