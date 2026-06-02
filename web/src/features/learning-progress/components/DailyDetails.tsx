import {
  CalendarDays,
  Clock,
  Gauge,
  CheckCircle2,
  Eye,
  Volume2,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../../../components/classNames';
import type { DailyPracticeSummary, PracticeSession } from '../types/learningProgress.types';
import { formatDuration, fullDateLabel, timeLabel } from '../utils/dateUtils';

interface Props {
  day: DailyPracticeSummary | null;
  onViewResult: (session: PracticeSession) => void;
  onListenAgain: (session: PracticeSession) => void;
  onViewTranscript: (session: PracticeSession) => void;
  onRetry: (session: PracticeSession) => void;
}

const programBadge: Record<PracticeSession['program'], string> = {
  IELTS: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
  TOEIC: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300',
};

export const DailyDetails = ({
  day,
  onViewResult,
  onListenAgain,
  onViewTranscript,
  onRetry,
}: Props) => {
  if (!day) {
    return (
      <div className="glass-card rounded-3xl p-10 border border-dashed border-slate-200 dark:border-slate-800 text-center h-full flex flex-col items-center justify-center">
        <CalendarDays className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-700 dark:text-slate-300">Pick a day to see details</h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          Click a bar in the chart or a date on the calendar.
        </p>
      </div>
    );
  }

  const empty = day.sessionCount === 0;

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 h-full min-h-0 flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 shrink-0">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">Daily Details</p>
          <h3 className="text-xl font-bold">{fullDateLabel(day.date)}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Stat icon={CheckCircle2} value={`${day.sessionCount}`} label="sessions" />
          <Stat icon={Clock} value={formatDuration(day.totalDurationMs)} label="time" />
          <Stat
            icon={Gauge}
            value={day.averageScore !== null ? String(day.averageScore) : '—'}
            label="avg"
          />
        </div>
      </div>

      {empty ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center flex-1 flex flex-col items-center justify-center">
          <span className="text-3xl block mb-2">🌱</span>
          <p className="font-semibold text-slate-600 dark:text-slate-300">No practice on this day</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            A rest day — jump back in whenever you're ready.
          </p>
        </div>
      ) : (
        <ul className="space-y-3 min-h-0 flex-1 overflow-y-auto pr-1">
          {day.sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-700/70 p-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{timeLabel(s.startedAt)}</span>
                    <span
                      className={cn(
                        'text-[11px] font-bold px-2 py-0.5 rounded-full',
                        programBadge[s.program],
                      )}
                    >
                      {s.program}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {s.skill}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{s.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatDuration(s.durationMs)}
                    </span>
                    {typeof s.score === 'number' && (
                      <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 font-semibold">
                        <Gauge className="w-3.5 h-3.5" /> {s.score}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions — gated on metadata availability */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ActionButton icon={Eye} label="View Result" onClick={() => onViewResult(s)} primary />
                  {s.audio && (
                    <ActionButton icon={Volume2} label="Listen Again" onClick={() => onListenAgain(s)} />
                  )}
                  {s.transcript && (
                    <ActionButton icon={FileText} label="Transcript" onClick={() => onViewTranscript(s)} />
                  )}
                  <ActionButton icon={RotateCcw} label="Retry" onClick={() => onRetry(s)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function Stat({ icon: Icon, value, label }: { icon: typeof Clock; value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5">
      <Icon className="w-4 h-4 text-slate-400" />
      <span className="text-sm font-bold">{value}</span>
      <span className="text-[11px] text-slate-400">{label}</span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  primary,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95',
        primary
          ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
