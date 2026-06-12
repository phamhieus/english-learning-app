import { Mic, Clock, Zap, Volume2 } from 'lucide-react';
import type { AudioAnalysis } from '../types/feedback.types';

interface AudioAnalysisCardProps {
  analysis: AudioAnalysis;
}

export function AudioAnalysisCard({ analysis }: AudioAnalysisCardProps) {
  const fillerEntries = Object.entries(analysis.fillerWords ?? {}).sort((a, b) => b[1] - a[1]);
  const topFillers = fillerEntries.slice(0, 5);

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 text-violet-500" />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Audio Analysis</span>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {analysis.durationSeconds !== undefined && (
          <StatPill
            icon={<Clock className="w-4 h-4" />}
            label="Duration"
            value={`${Math.round(analysis.durationSeconds)}s`}
            color="violet"
          />
        )}
        {analysis.speakingRateWpm !== undefined && (
          <StatPill
            icon={<Zap className="w-4 h-4" />}
            label="Speaking rate"
            value={`${analysis.speakingRateWpm} wpm`}
            color={analysis.speakingRateWpm >= 120 && analysis.speakingRateWpm <= 160 ? 'emerald' : 'orange'}
          />
        )}
        {analysis.longPauseCount !== undefined && (
          <StatPill
            icon={<span className="text-sm">⏸</span>}
            label="Long pauses"
            value={String(analysis.longPauseCount)}
            color={analysis.longPauseCount === 0 ? 'emerald' : analysis.longPauseCount <= 3 ? 'orange' : 'red'}
          />
        )}
        {analysis.mispronouncedWords && (
          <StatPill
            icon={<Volume2 className="w-4 h-4" />}
            label="Pronunciation"
            value={`${analysis.mispronouncedWords.length} issues`}
            color={analysis.mispronouncedWords.length === 0 ? 'emerald' : 'orange'}
          />
        )}
      </div>

      {/* Filler words */}
      {topFillers.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Filler words</div>
          <div className="flex flex-wrap gap-2">
            {topFillers.map(([word, count]) => (
              <span key={word} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/40">
                "{word}"
                <span className="bg-amber-200 dark:bg-amber-800/50 rounded-full px-1.5 py-0.5 text-[10px]">{count}×</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pronunciation issues */}
      {analysis.mispronouncedWords && analysis.mispronouncedWords.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Pronunciation notes</div>
          <div className="space-y-2">
            {analysis.mispronouncedWords.map((pw, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">"{pw.word}"</span>
                  <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-full">
                    {pw.detectedProblem}
                  </span>
                </div>
                {pw.suggestedPractice && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{pw.suggestedPractice}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rhythm / intonation comments */}
      {(analysis.rhythmComment || analysis.intonationComment) && (
        <div className="space-y-2">
          {analysis.rhythmComment && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Rhythm: </span>
              {analysis.rhythmComment}
            </p>
          )}
          {analysis.intonationComment && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Intonation: </span>
              {analysis.intonationComment}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type PillColor = 'violet' | 'emerald' | 'orange' | 'red';

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: PillColor }) {
  const colorClass: Record<PillColor, string> = {
    violet: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900/40',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40',
    orange: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/40',
    red: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/40',
  };

  return (
    <div className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${colorClass[color]}`}>
      {icon}
      <div className="text-lg font-black">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</div>
    </div>
  );
}
