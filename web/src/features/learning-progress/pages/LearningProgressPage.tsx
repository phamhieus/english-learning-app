import { useNavigate } from 'react-router-dom';
import { Activity, LineChart, Sparkles } from 'lucide-react';
import { useToast } from '../../../components/useToast';
import { useLearningProgress } from '../hooks/useLearningProgress';
import type { PracticeSession } from '../types/learningProgress.types';
import { ProgramFilter } from '../components/ProgramFilter';
import { TimeRangeFilter } from '../components/TimeRangeFilter';
import { SummaryCards } from '../components/SummaryCards';
import { ActivityChart } from '../components/ActivityChart';
import { CalendarView } from '../components/CalendarView';
import { DailyDetails } from '../components/DailyDetails';

const PROGRAM_LABELS = {
  All: 'IELTS + TOEIC',
  IELTS: 'IELTS only',
  TOEIC: 'TOEIC only',
} as const;

const LearningProgressPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    loading,
    filter,
    setFilter,
    streak,
    summary,
    chartDays,
    selectedDate,
    selectDate,
    selectedDay,
    calendarActiveDays,
  } = useLearningProgress();

  const isCalendar = filter.range === 'calendar';
  const isCompactChart = filter.range === '30d';

  // ── Daily-detail actions ──────────────────────────────────────────────
  const handleViewResult = (s: PracticeSession) => {
    if (s.resultRef) navigate(s.resultRef);
    else toast.info('No saved result for this session.');
  };
  const handleRetry = (s: PracticeSession) => {
    if (s.retryRef) navigate(s.retryRef);
    else toast.info('Retry is unavailable for this session.');
  };
  const handleListenAgain = (s: PracticeSession) =>
    toast.info(s.audio ? `Loading your recording (${s.title})…` : 'No audio available.');
  const handleViewTranscript = (s: PracticeSession) =>
    toast.info(s.transcript ? `Opening transcript for “${s.title}”.` : 'No transcript available.');

  const hasAnyData = chartDays.some((d) => d.sessionCount > 0) || streak.longest > 0;

  return (
    <div className="animate-in fade-in duration-500">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-500" /> Learning Progress
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Your practice history and streak across IELTS &amp; TOEIC.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ProgramFilter value={filter.program} onChange={(program) => setFilter({ program })} />
          <TimeRangeFilter value={filter.range} onChange={(range) => setFilter({ range })} />
        </div>
      </div>

      {loading ? (
        <div className="glass-card rounded-3xl p-16 text-center text-slate-400">
          <Sparkles className="w-8 h-8 mx-auto mb-3 animate-pulse text-indigo-400" />
          Loading your progress…
        </div>
      ) : !hasAnyData ? (
        <EmptyState onStart={() => navigate('/speaking')} />
      ) : (
        <div className="space-y-7">
          {/* ── Summary cards ──────────────────────────────────────────── */}
          <SummaryCards
            streak={streak}
            summary={summary}
            programLabel={PROGRAM_LABELS[filter.program]}
          />

          {/* ── Chart / Calendar + Daily details ───────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-5 items-stretch gap-6">
            <div className="xl:col-span-3 glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 h-full">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-indigo-500" />
                  {isCalendar ? 'Calendar' : 'Practice Activity'}
                </h2>
                {!isCalendar && (
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {filter.range === '30d' ? 'Last 30 days' : 'Last 7 days'}
                  </span>
                )}
              </div>

              {isCalendar ? (
                <CalendarView
                  year={filter.calendarYear}
                  month={filter.calendarMonth}
                  activeDays={calendarActiveDays}
                  selectedDate={selectedDate}
                  onSelectDay={selectDate}
                  onMonthChange={(calendarYear, calendarMonth) =>
                    setFilter({ calendarYear, calendarMonth })
                  }
                />
              ) : (
                <ActivityChart
                  days={chartDays}
                  program={filter.program}
                  compact={isCompactChart}
                  selectedDate={selectedDate}
                  onSelectDay={selectDate}
                />
              )}

              {filter.program === 'All' && !isCalendar && (
                <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 rounded-full bg-indigo-500" /> IELTS
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 rounded-full bg-cyan-500" /> TOEIC
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full ring-2 ring-amber-400/70" /> Today
                  </span>
                </div>
              )}
            </div>

            <div className="xl:col-span-2 h-full">
              <DailyDetails
                day={selectedDay}
                onViewResult={handleViewResult}
                onListenAgain={handleListenAgain}
                onViewTranscript={handleViewTranscript}
                onRetry={handleRetry}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="glass-card rounded-3xl p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
        <Activity className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
        No practice yet
      </h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
        Complete an IELTS or TOEIC activity and it'll show up here — your streak, practice time, and
        daily breakdown all build automatically.
      </p>
      <button
        onClick={onStart}
        className="bg-indigo-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-indigo-600 hover:scale-105 transition-all active:scale-95"
      >
        Start practising
      </button>
    </div>
  );
}

export default LearningProgressPage;
