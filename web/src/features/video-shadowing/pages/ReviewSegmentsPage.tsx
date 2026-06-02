import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ListChecks, Scissors, Combine, Trash2, Plus, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../components/useToast';
import { StepProgress } from '../components/StepProgress';
import { lessonRepo, segmentRepo } from '../services/storage/videoShadowingRepository';
import { fileStorage } from '../services/storage/opfsFileStorage';
import { editText, splitSegment, mergeWithNext, deleteSegment, addSegmentAfter } from '../utils/segmentOperations';
import { computeSegmentWarnings } from '../utils/transcriptSegmenter';
import { formatRange } from '../utils/timestampUtils';
import type { VideoTranscriptSegment } from '../models/segment';
import type { VideoShadowingLesson } from '../models/lesson';

export default function ReviewSegmentsPage() {
  const { lessonId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [lesson, setLesson] = useState<VideoShadowingLesson | null>(null);
  const [segments, setSegments] = useState<VideoTranscriptSegment[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    (async () => {
      const l = (await lessonRepo.get(lessonId)) ?? null;
      const segs = await segmentRepo.listByLesson(lessonId);
      if (l?.localVideoFileId) url = (await fileStorage.getObjectUrl(l.localVideoFileId)) ?? null;
      else if (l?.sourceUrl) url = l.sourceUrl;
      if (!cancelled) {
        setLesson(l);
        setSegments(segs);
        setVideoUrl(url);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [lessonId]);

  const warnings = lesson ? computeSegmentWarnings(segments, lesson.segmentMode) : [];
  const warnFor = (id: string) => warnings.find((w) => w.segmentId === id);

  const apply = (next: VideoTranscriptSegment[]) => setSegments(next);

  const save = async (start: boolean) => {
    await segmentRepo.replaceForLesson(lessonId, segments);
    if (lesson) await lessonRepo.save({ ...lesson, status: 'Ready', processingProgress: 100 });
    if (start) navigate(`/video-shadowing/lessons/${lessonId}/practice`);
    else toast.success('Đã lưu nháp.');
  };

  if (loading) return <div className="glass-card rounded-3xl py-16 text-center text-slate-400">Đang tải…</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-center">Add Video Shadowing</h1>
      <StepProgress current={2} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6 max-w-6xl mx-auto">
        {/* Video preview */}
        <div className="lg:sticky lg:top-4 h-fit">
          <div className="rounded-2xl overflow-hidden glass-card aspect-video flex items-center justify-center">
            {videoUrl ? (
              <video src={videoUrl} controls className="w-full h-full bg-black" />
            ) : (
              <p className="text-sm text-slate-400 px-6 text-center">Không có bản xem trước video cho nguồn này.</p>
            )}
          </div>
          {lesson?.sourceType === 'DirectUrl' && (
            <p className="text-xs text-slate-400 mt-2">Nếu video không phát được, nguồn có thể không cho phép CORS.</p>
          )}
        </div>

        {/* Segment editor */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2"><ListChecks className="w-5 h-5 text-indigo-500" /> Review segments</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Chỉnh text, tách hoặc gộp câu trước khi luyện.</p>
            </div>
            <span className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">{segments.length} segments</span>
          </div>

          {segments.length === 0 && (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400 mb-4">
              Chưa có segment. Thêm thủ công hoặc quay lại tải phụ đề.
              <div className="mt-4">
                <button onClick={() => apply(addSegmentAfter(segments, '', lessonId))} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add segment
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 mb-6">
            {segments.map((s, i) => {
              const w = warnFor(s.id);
              return (
                <div key={s.id} className="glass-card rounded-2xl p-4 flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-1">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[11px] text-slate-400">{formatRange(s.startMs, s.endMs)}</span>
                    <input
                      value={s.text}
                      onChange={(e) => apply(editText(segments, s.id, e.target.value))}
                      className="w-full bg-transparent text-[15px] font-medium outline-none focus:bg-slate-50 dark:focus:bg-slate-800 rounded-lg px-2 py-1.5 -ml-2 mt-0.5"
                    />
                    {w && <p className="text-[11px] text-orange-500 flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3" /> {w.message}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <IconBtn title="Split" onClick={() => apply(splitSegment(segments, s.id))}><Scissors className="w-4 h-4" /></IconBtn>
                    <IconBtn title="Merge with next" onClick={() => apply(mergeWithNext(segments, s.id))}><Combine className="w-4 h-4" /></IconBtn>
                    <IconBtn title="Add after" onClick={() => apply(addSegmentAfter(segments, s.id, lessonId))}><Plus className="w-4 h-4" /></IconBtn>
                    <IconBtn title="Delete" onClick={() => apply(deleteSegment(segments, s.id))}><Trash2 className="w-4 h-4" /></IconBtn>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/video-shadowing/add')} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex gap-2">
              <button onClick={() => save(false)} className="px-5 py-3 rounded-xl font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Save draft</button>
              <button onClick={() => save(true)} disabled={segments.length === 0} className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 disabled:cursor-not-allowed">
                <Check className="w-5 h-5" /> Save & Start Practice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition">
      {children}
    </button>
  );
}
