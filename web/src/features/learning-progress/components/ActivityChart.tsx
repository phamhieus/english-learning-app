import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type {
  DailyPracticeSummary,
  ProgramFilterValue,
} from '../types/learningProgress.types';
import {
  compactDayLabel,
  formatDuration,
  msToMinutes,
  shortDayLabel,
  todayKey,
} from '../utils/dateUtils';

const IELTS_COLOR = '#6366f1'; // indigo-500
const TOEIC_COLOR = '#06b6d4'; // cyan-500
const TODAY_STROKE = '#f59e0b'; // amber-500

interface ChartDatum {
  date: string;
  label: string;
  ieltsMin: number;
  toeicMin: number;
  totalMin: number;
  isToday: boolean;
  summary: DailyPracticeSummary;
}

interface Props {
  days: DailyPracticeSummary[];
  program: ProgramFilterValue;
  /** Compact rendering for the 30-day view (sparse ticks, lighter animation). */
  compact?: boolean;
  selectedDate: string | null;
  onSelectDay: (key: string) => void;
}

// Recharts 3.x doesn't export a precise props type for custom tooltip content,
// so we type only the fields we read.
interface TooltipContentProps {
  active?: boolean;
  payload?: { payload: ChartDatum }[];
}

interface ChartDotProps {
  cx?: number;
  cy?: number;
  payload?: ChartDatum;
  stroke?: string;
  value?: number;
}

function CustomTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;
  const s = datum.summary;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg px-3.5 py-2.5 text-sm">
      <p className="font-bold text-slate-800 dark:text-slate-100 mb-1.5">
        {shortDayLabelFull(datum.date)}
      </p>
      {s.sessionCount === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">No practice</p>
      ) : (
        <div className="space-y-0.5 text-slate-600 dark:text-slate-300">
          <Row label="Sessions" value={String(s.sessionCount)} />
          <Row label="Duration" value={formatDuration(s.totalDurationMs)} />
          {s.averageScore !== null && <Row label="Avg score" value={String(s.averageScore)} />}
          <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-700/60">
            <Row label="IELTS" value={`${s.ieltsCount} · ${formatDuration(s.ieltsDurationMs)}`} dot={IELTS_COLOR} />
            <Row label="TOEIC" value={`${s.toeicCount} · ${formatDuration(s.toeicDurationMs)}`} dot={TOEIC_COLOR} />
          </div>
        </div>
      )}
    </div>
  );
}

function shortDayLabelFull(key: string): string {
  // Slightly fuller than the axis label for the tooltip header.
  const d = new Date(`${key}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function Row({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="flex items-center gap-1.5">
        {dot && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />}
        {label}
      </span>
      <span className="font-semibold text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}

export const ActivityChart = ({ days, program, compact, selectedDate, onSelectDay }: Props) => {
  const today = todayKey();

  const data = useMemo<ChartDatum[]>(
    () =>
      days.map((d) => ({
        date: d.date,
        label: compact ? compactDayLabel(d.date) : shortDayLabel(d.date),
        ieltsMin: msToMinutes(d.ieltsDurationMs),
        toeicMin: msToMinutes(d.toeicDurationMs),
        totalMin: msToMinutes(d.totalDurationMs),
        isToday: d.date === today,
        summary: d,
      })),
    [days, compact, today],
  );

  const isStacked = program === 'All';
  const handleClick = (key: string) => key && onSelectDay(key);

  const lineOpacity = (key: 'ieltsMin' | 'toeicMin') =>
    selectedDate && !data.some((d) => d.date === selectedDate && d[key] > 0) ? 0.45 : 1;

  const renderDot =
    (color: string) =>
    ({ cx, cy, payload, value }: ChartDotProps) => {
      if (cx === undefined || cy === undefined || !payload || value === undefined) return null;
      const isDimmed = selectedDate && selectedDate !== payload.date;
      const radius = payload.isToday || selectedDate === payload.date ? 5 : 3.5;

      return (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="#fff"
          stroke={payload.isToday ? TODAY_STROKE : color}
          strokeWidth={payload.isToday || selectedDate === payload.date ? 2.5 : 2}
          opacity={isDimmed ? 0.45 : 1}
          className="cursor-pointer"
          onClick={() => handleClick(payload.date)}
        />
      );
    };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
        >
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            interval={compact ? 3 : 0}
            dy={6}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            width={48}
            allowDecimals={false}
            label={{
              value: 'min',
              angle: -90,
              position: 'insideLeft',
              offset: 16,
              style: { fill: '#cbd5e1', fontSize: 11 },
            }}
          />
          <Tooltip cursor={{ stroke: 'rgba(99,102,241,0.18)', strokeWidth: 1 }} content={<CustomTooltip />} />

          {isStacked ? (
            <>
              <Line
                type="monotone"
                dataKey="ieltsMin"
                name="IELTS"
                stroke={IELTS_COLOR}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={renderDot(IELTS_COLOR)}
                activeDot={{ r: 6 }}
                opacity={lineOpacity('ieltsMin')}
                isAnimationActive={!compact}
              />
              <Line
                type="monotone"
                dataKey="toeicMin"
                name="TOEIC"
                stroke={TOEIC_COLOR}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={renderDot(TOEIC_COLOR)}
                activeDot={{ r: 6 }}
                opacity={lineOpacity('toeicMin')}
                isAnimationActive={!compact}
              />
            </>
          ) : (
            <Line
              type="monotone"
              dataKey={program === 'IELTS' ? 'ieltsMin' : 'toeicMin'}
              name={program}
              stroke={program === 'IELTS' ? IELTS_COLOR : TOEIC_COLOR}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={renderDot(program === 'IELTS' ? IELTS_COLOR : TOEIC_COLOR)}
              activeDot={{ r: 6 }}
              opacity={lineOpacity(program === 'IELTS' ? 'ieltsMin' : 'toeicMin')}
              isAnimationActive={!compact}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
