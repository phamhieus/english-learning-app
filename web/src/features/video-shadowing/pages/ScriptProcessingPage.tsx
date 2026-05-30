import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Loader2, Circle, XCircle, RotateCcw, X, Captions } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { StepProgress } from '../components/StepProgress';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { useProcessingJob } from '../hooks/useProcessingJob';

export default function ScriptProcessingPage() {
  const { lessonId = '' } = useParams();
  const navigate = useNavigate();
  const { status, steps, progress, error, run, cancel } = useProcessingJob(lessonId);

  useEffect(() => {
    run();
  }, [run]);

  useEffect(() => {
    if (status === 'done') navigate(`/video-shadowing/lessons/${lessonId}/review`);
  }, [status, lessonId, navigate]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-center">Add Video Shadowing</h1>
      <div className="flex justify-center mb-6"><PrivacyBadge /></div>
      <StepProgress current={1} />

      <div className="max-w-xl mx-auto glass-card rounded-3xl p-10 flex flex-col items-center text-center mt-4">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-500/20" />
          {status === 'running' && <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />}
          <div className="absolute inset-0 flex items-center justify-center">
            {status === 'failed' ? <XCircle className="w-12 h-12 text-red-500" /> : <Loader2 className={cn('w-10 h-10 text-indigo-500', status === 'running' && 'animate-spin')} />}
          </div>
        </div>

        <h2 className="text-xl font-bold mb-1">{status === 'failed' ? 'Không tạo được script' : 'Đang tạo bài shadowing…'}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          {status === 'failed' ? error : 'Mọi xử lý chạy trên máy bạn. Lần đầu có thể cần tải mô hình AI.'}
        </p>

        {status !== 'failed' && (
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mb-6 mt-2">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          {steps.map((s) => (
            <div
              key={s.key}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border',
                s.state === 'done' ? 'bg-green-50 border-green-100 dark:bg-green-500/10 dark:border-green-500/20'
                  : s.state === 'active' ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20'
                  : s.state === 'failed' ? 'bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-500/20'
                  : 'bg-slate-50 border-slate-100 dark:bg-slate-800/60 dark:border-slate-700/60',
              )}
            >
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                s.state === 'done' ? 'bg-green-500 text-white'
                  : s.state === 'active' ? 'bg-indigo-600 text-white'
                  : s.state === 'failed' ? 'bg-red-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400')}
              >
                {s.state === 'done' ? <Check className="w-4 h-4" /> : s.state === 'active' ? <Loader2 className="w-4 h-4 animate-spin" /> : s.state === 'failed' ? <X className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
              </div>
              <span className={cn('text-sm font-semibold flex-1 text-left', s.state === 'idle' ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200')}>{s.label}</span>
              {s.state === 'done' && <span className="text-xs text-green-600 font-medium">Done</span>}
              {s.state === 'active' && <span className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">Working…</span>}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-8">
          {status === 'running' && (
            <button onClick={() => { cancel(); navigate('/video-shadowing'); }} className="px-5 py-2.5 rounded-xl font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
          {status === 'failed' && (
            <>
              <button onClick={run} className="px-5 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white flex items-center gap-2 shadow-md shadow-indigo-500/25">
                <RotateCcw className="w-4 h-4" /> Retry
              </button>
              <button onClick={() => navigate(`/video-shadowing/lessons/${lessonId}/review`)} className="px-5 py-2.5 rounded-xl font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Captions className="w-4 h-4" /> Thêm phụ đề / Review
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
