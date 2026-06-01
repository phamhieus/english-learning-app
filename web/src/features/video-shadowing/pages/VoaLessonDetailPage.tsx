import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, BarChart3, Tag, Clock, Film, Headphones, Mic, Repeat2, Play, List, Lock, Volume2 } from 'lucide-react';
import { VideoThumb, SourceBadge } from '../components/primitives';
import { getBuiltInVoaLesson } from '../services/video-source/builtInVoaResolver';
import { formatClock } from '../utils/timestampUtils';

export default function VoaLessonDetailPage() {
  const { lessonId = '' } = useParams();
  const navigate = useNavigate();
  const lesson = getBuiltInVoaLesson(lessonId);

  if (!lesson) {
    return (
      <div className="glass-card rounded-3xl py-16 text-center text-slate-500 dark:text-slate-400">
        Không tìm thấy bài học này.
        <div className="mt-4">
          <button onClick={() => navigate('/video-shadowing')} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold">Back to library</button>
        </div>
      </div>
    );
  }

  const previewSegs = lesson.segments.slice(0, 5);
  const remaining = lesson.segments.length - previewSegs.length;

  return (
    <div>
      <button onClick={() => navigate('/video-shadowing')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to library
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 mb-8">
        <div>
          <div className="rounded-3xl overflow-hidden shadow-xl shadow-slate-200/60 dark:shadow-black/40">
            <VideoThumb grad={lesson.grad} source="VOA" duration={formatClock(lesson.durationMs)} rounded="rounded-3xl" big videoUrl={lesson.videoUrl} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Info className="w-3.5 h-3.5" /> {lesson.sourceCredit} · dùng cho mục đích học tập
          </div>
        </div>

        <div className="flex flex-col">
          <div className="w-fit"><SourceBadge source="VOA" /></div>
          <h1 className="text-3xl font-bold mt-3 mb-2 leading-tight">{lesson.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-5">{lesson.description}</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {([[BarChart3, 'Level', lesson.level], [Tag, 'Topic', lesson.topic], [Clock, 'Duration', formatClock(lesson.durationMs)], [Film, 'Segments', String(lesson.segments.length)]] as const).map(
              ([Icon, k, val]) => (
                <div key={k} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-4 py-3 flex items-center gap-3">
                  <Icon className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{k}</p>
                    <p className="font-bold text-sm">{val}</p>
                  </div>
                </div>
              ),
            )}
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">You'll practise</p>
          <div className="flex flex-wrap gap-2 mb-7">
            {([[Headphones, 'Listening'], [Mic, 'Pronunciation'], [Repeat2, 'Shadowing']] as const).map(([Icon, s]) => (
              <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-sm font-semibold">
                <Icon className="w-4 h-4" /> {s}
              </span>
            ))}
          </div>
          <button
            onClick={() => navigate(`/video-shadowing/lessons/${lesson.id}/practice`)}
            className="mt-auto h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:brightness-110 transition"
          >
            <Play className="w-5 h-5" style={{ fill: 'currentColor' }} /> Start Shadowing
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><List className="w-5 h-5 text-indigo-500" /> Segment preview</h2>
          <span className="text-xs text-slate-400 font-medium">{lesson.segments.length} câu · xem trước {previewSegs.length} câu đầu</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {previewSegs.map((s, i) => (
            <div key={s.id} className="flex items-center gap-4 py-3">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-400 text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="font-mono text-xs text-slate-400 w-12 shrink-0">{formatClock(s.startMs)}</span>
              <span className="text-[15px] text-slate-700 dark:text-slate-200 flex-1">{s.text}</span>
              <Volume2 className="w-4 h-4 text-slate-300" />
            </div>
          ))}
          {remaining > 0 && (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-400 font-medium">
              <Lock className="w-3.5 h-3.5" /> {remaining} câu còn lại mở khi bắt đầu luyện
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
