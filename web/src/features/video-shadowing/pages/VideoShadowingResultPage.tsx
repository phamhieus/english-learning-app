import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ListChecks, Clock, Target, Sparkles, List, RotateCcw, LayoutGrid, Play, Volume2, Info } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { ScoreRing } from '../components/primitives';
import { getBuiltInVoaLesson } from '../services/video-source/builtInVoaResolver';
import { lessonRepo, segmentRepo, sessionRepo, attemptRepo } from '../services/storage/videoShadowingRepository';
import { fileStorage } from '../services/storage/opfsFileStorage';
import { formatClock } from '../utils/timestampUtils';
import type { VideoTranscriptSegment } from '../models/segment';
import type { VideoShadowingSession, VideoShadowingAttempt } from '../models/session';

export default function VideoShadowingResultPage() {
  const { lessonId = '' } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [credit, setCredit] = useState('');
  const [segments, setSegments] = useState<VideoTranscriptSegment[]>([]);
  const [session, setSession] = useState<VideoShadowingSession | null>(null);
  const [attempts, setAttempts] = useState<VideoShadowingAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const voa = getBuiltInVoaLesson(lessonId);
      if (voa) {
        setTitle(voa.title);
        setCredit(voa.sourceCredit ?? '');
        setSegments(voa.segments);
      } else {
        const l = await lessonRepo.get(lessonId);
        setTitle(l?.title ?? 'Lesson');
        setSegments(await segmentRepo.listByLesson(lessonId));
      }
      const sessions = await sessionRepo.listByLesson(lessonId);
      const latest = sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
      const att = latest ? await attemptRepo.listBySession(latest.id) : [];
      if (!cancelled) {
        setSession(latest);
        setAttempts(att);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  if (loading) return <div className="glass-card rounded-3xl py-16 text-center text-slate-400">Loading results...</div>;

  const scored = attempts.filter((a) => a.totalScore != null);
  const hasScores = scored.length > 0;
  const recordedCount = new Set(attempts.map((a) => a.segmentId)).size;
  const total = session?.totalScore ?? 0;

  const cards: [string, number | undefined, string, typeof Target][] = [
    ['Pronunciation', session?.pronunciationScore, 'stroke-green-500', ListChecks],
    ['Fluency', session?.fluencyScore, 'stroke-indigo-500', Target],
    ['Rhythm', session?.rhythmScore, 'stroke-orange-500', Clock],
    ['Completion', session?.completionScore, 'stroke-purple-500', ListChecks],
  ];

  return (
    <div>
      <div className="text-center mb-7">
        <h1 className="text-3xl font-bold mb-1">Session Complete 🎉</h1>
        <p className="text-slate-500 dark:text-slate-400">{title}{credit ? ` · ${credit}` : ''}</p>
      </div>

      {/* Summary */}
      <div className="glass-card rounded-3xl p-8 mb-6 flex flex-wrap items-center gap-8 justify-between">
        {hasScores ? (
          <ScoreRing score={total} label="Total Score" colorClass="stroke-indigo-500" size={150} />
        ) : (
          <div className="flex flex-col items-center justify-center w-[150px] h-[150px] rounded-full border-4 border-dashed border-slate-200 dark:border-slate-700 text-center">
            <span className="text-3xl font-bold text-slate-300 dark:text-slate-600">—</span>
            <span className="text-[11px] text-slate-400 px-3 mt-1">Local AI grading enabled</span>
          </div>
        )}
        <div className="flex-1 grid grid-cols-3 gap-6 min-w-[300px]">
          {([['Recorded', `${recordedCount} / ${segments.length}`, ListChecks, 'text-indigo-500'],
             ['Practice time', formatClock(session?.practiceDurationMs ?? 0), Clock, 'text-purple-500'],
             ['Avg. accuracy', hasScores ? `${total}%` : '—', Target, 'text-green-500']] as const).map(([k, v, Icon, col]) => (
            <div key={k}>
              <Icon className={cn('w-5 h-5 mb-2', col)} />
              <p className="text-2xl font-bold">{v}</p>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{k}</p>
            </div>
          ))}
        </div>
        <div className="w-full md:w-72 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 flex gap-3">
          <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
            {hasScores ? 'Great job! Keep matching the rhythm and pronounce words fully down to the end of each sentence.' : 'You have completed recording the segments. Automatic scoring will be available once the local AI models are loaded.'}
          </p>
        </div>
      </div>

      {/* Score cards */}
      {hasScores && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map(([k, v, col, Icon]) => (
            <div key={k} className="glass-card rounded-2xl p-5 flex items-center gap-4">
              <ScoreRing score={v ?? 0} colorClass={col} size={86} />
              <div>
                <Icon className="w-4 h-4 text-slate-400 mb-1" />
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm leading-tight">{k}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Per-segment breakdown */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><List className="w-5 h-5 text-indigo-500" /> Segment breakdown</h2>
      <div className="flex flex-col gap-3 mb-8">
        {segments.map((s, i) => {
          const att = [...attempts].reverse().find((a) => a.segmentId === s.id);
          return <SegmentResultRow key={s.id} index={i} segment={s} attempt={att} />;
        })}
      </div>

      <div className="flex justify-center gap-4 pb-4">
        <button onClick={() => navigate(`/video-shadowing/lessons/${lessonId}/practice`)} className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-700">
          <RotateCcw className="w-5 h-5" /> Practice Again
        </button>
        <button onClick={() => navigate('/video-shadowing')} className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
          <LayoutGrid className="w-5 h-5" /> Back to Library
        </button>
      </div>
    </div>
  );
}

function SegmentResultRow({ index, segment, attempt }: { index: number; segment: VideoTranscriptSegment; attempt?: VideoShadowingAttempt }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    if (attempt?.userAudioFileId) {
      fileStorage.getObjectUrl(attempt.userAudioFileId).then((u) => {
        url = u ?? null;
        setAudioUrl(u ?? null);
      });
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [attempt?.userAudioFileId]);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold mb-2">{segment.text || '—'}</p>
          {audioUrl ? (
            <audio src={audioUrl} controls className="h-9 w-full max-w-sm" />
          ) : (
            <span className="text-xs text-slate-400 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Not recorded yet</span>
          )}
          {attempt?.missingWords?.length ? (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {attempt.missingWords.slice(0, 6).map((w) => (
                <span key={w} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20">✕ {w}</span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {attempt?.totalScore != null ? (
            <span className={cn('px-2.5 py-1 rounded-lg text-sm font-bold',
              attempt.totalScore >= 85 ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                : attempt.totalScore >= 70 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-700')}>{attempt.totalScore}</span>
          ) : (
            <span className="text-slate-300 dark:text-slate-600">
              {attempt ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
