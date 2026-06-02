// Loads completed practice sessions from the repository and derives every piece
// of state the Learning Progress page renders, reacting to the active filter.
//
// Streak is computed from ALL sessions (global, program-agnostic). Everything
// else respects the program filter. The time-range filter controls which day
// keys feed the chart and which day is selected by default.

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  DailyPracticeSummary,
  FilteredSummary,
  PracticeHistoryFilter,
  PracticeSession,
  StreakSummary,
} from '../types/learningProgress.types';
import { practiceSessionRepository } from '../services/storage/practiceSessionRepository';
import { ensureSeedData } from '../services/seedProgressData';
import {
  buildDailySummaries,
  computeFilteredSummary,
  computeStreak,
  filterByProgram,
  summarizeDay,
} from '../utils/progressCalculations';
import { recentDayKeys, toLocalDateKey, todayKey } from '../utils/dateUtils';

const now = new Date();

const DEFAULT_FILTER: PracticeHistoryFilter = {
  program: 'All',
  range: '7d',
  calendarMonth: now.getMonth(),
  calendarYear: now.getFullYear(),
};

export interface LearningProgressState {
  loading: boolean;
  filter: PracticeHistoryFilter;
  setFilter: (patch: Partial<PracticeHistoryFilter>) => void;

  /** Global streak — does NOT react to the program filter. */
  streak: StreakSummary;
  /** Summary cards that react to the program filter. */
  summary: FilteredSummary;

  /** Daily summaries for the active time range (chart data). */
  chartDays: DailyPracticeSummary[];

  /** Currently selected day key + its summary (for Daily Details). */
  selectedDate: string | null;
  selectDate: (key: string | null) => void;
  selectedDay: DailyPracticeSummary | null;

  /** Days in the visible calendar month that have ≥1 completed session. */
  calendarActiveDays: Set<string>;

  reload: () => void;
}

export function useLearningProgress(): LearningProgressState {
  const [allSessions, setAllSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilterState] = useState<PracticeHistoryFilter>(DEFAULT_FILTER);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    await ensureSeedData();
    const sessions = await practiceSessionRepository.getAll();
    setAllSessions(sessions);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setFilter = useCallback((patch: Partial<PracticeHistoryFilter>) => {
    setFilterState((prev) => ({ ...prev, ...patch }));
    // Switching program/range invalidates the previously selected day.
    if (patch.program !== undefined || patch.range !== undefined) {
      setSelectedDate(null);
    }
  }, []);

  // Streak is GLOBAL — derived from every session, ignoring the program filter.
  const streak = useMemo(() => computeStreak(allSessions), [allSessions]);

  // Program-filtered session set drives all the other (filter-aware) views.
  const programSessions = useMemo(
    () => filterByProgram(allSessions, filter.program),
    [allSessions, filter.program],
  );

  const summary = useMemo(() => computeFilteredSummary(programSessions), [programSessions]);

  // Chart day keys depend on the time-range mode. Calendar mode reuses the
  // 7-day chart strip for context above the calendar grid.
  const chartDayKeys = useMemo(
    () => recentDayKeys(filter.range === '30d' ? 30 : 7),
    [filter.range],
  );

  const chartDays = useMemo(
    () => buildDailySummaries(programSessions, chartDayKeys),
    [programSessions, chartDayKeys],
  );

  const calendarActiveDays = useMemo(() => {
    const keys = new Set<string>();
    for (const s of programSessions) {
      const key = toLocalDateKey(s.completedAt);
      const d = new Date(s.completedAt);
      if (d.getMonth() === filter.calendarMonth && d.getFullYear() === filter.calendarYear) {
        keys.add(key);
      }
    }
    return keys;
  }, [programSessions, filter.calendarMonth, filter.calendarYear]);

  // Default the selected day to today (or the most recent active day) so Daily
  // Details is never empty on first paint.
  const effectiveSelectedDate = useMemo(() => {
    if (selectedDate) return selectedDate;
    const today = todayKey();
    if (chartDayKeys.includes(today)) return today;
    const active = chartDays.filter((d) => d.sessionCount > 0);
    return active.length ? active[active.length - 1].date : null;
  }, [selectedDate, chartDayKeys, chartDays]);

  const selectedDay = useMemo<DailyPracticeSummary | null>(() => {
    if (!effectiveSelectedDate) return null;
    const daySessions = programSessions.filter(
      (s) => toLocalDateKey(s.completedAt) === effectiveSelectedDate,
    );
    return summarizeDay(effectiveSelectedDate, daySessions);
  }, [effectiveSelectedDate, programSessions]);

  return {
    loading,
    filter,
    setFilter,
    streak,
    summary,
    chartDays,
    selectedDate: effectiveSelectedDate,
    selectDate: setSelectedDate,
    selectedDay,
    calendarActiveDays,
    reload: () => void load(),
  };
}
