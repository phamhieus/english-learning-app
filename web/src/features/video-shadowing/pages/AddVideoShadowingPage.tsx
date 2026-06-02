import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, Captions, Sparkles, Link2, Type, AlignLeft, Pilcrow, FileVideo, X, AlertTriangle } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { Select } from '../../../components/Select';
import { useToast } from '../../../components/useToast';
import { StepProgress } from '../components/StepProgress';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { useVideoImport } from '../hooks/useVideoImport';
import { createSubtitleParser } from '../utils/subtitleParser';
import { validateMediaUrl } from '../utils/urlValidation';
import { humanFileSize } from '../utils/fileValidation';
import { toFriendlyError } from '../utils/errorCodes';
import { lessonRepo, segmentRepo } from '../services/storage/videoShadowingRepository';
import type { LessonLevel, SegmentMode } from '../models/lesson';

type Source = 'upload' | 'link';
const LEVELS: LessonLevel[] = ['Auto', 'A1', 'A2', 'B1', 'B2'];
const TOPICS = ['Daily Conversation', 'Pronunciation', 'Grammar', 'Vocabulary', 'Office English', 'Travel English'];
const MODES: { value: SegmentMode; label: string; Icon: typeof Type }[] = [
  { value: 'Sentence', label: 'Sentence', Icon: Type },
  { value: 'ShortPhrase', label: 'Short phrase', Icon: AlignLeft },
  { value: 'Paragraph', label: 'Paragraph', Icon: Pilcrow },
];

export default function AddVideoShadowingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { importVideo, importing, error, durationWarning } = useVideoImport();

  const [source, setSource] = useState<Source>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [title, setTitle] = useState('My English clip');
  const [level, setLevel] = useState<LessonLevel>('Auto');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [mode, setMode] = useState<SegmentMode>('Sentence');
  const [busy, setBusy] = useState(false);

  const videoInput = useRef<HTMLInputElement>(null);
  const subInput = useRef<HTMLInputElement>(null);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setVideoFile(f);
  };

  const canGenerate =
    !importing && !busy && (source === 'upload' ? !!videoFile : url.trim().length > 0 && !urlError);

  const handleGenerate = async () => {
    try {
      setBusy(true);
      if (source === 'upload') {
        if (!videoFile) return;
        const { lesson, hasSegments } = await importVideo({ videoFile, subtitleFile, title, level, topic, segmentMode: mode });
        if (hasSegments) {
          toast.success('Segments created from subtitles.');
          navigate(`/video-shadowing/lessons/${lesson.id}/review`);
        } else {
          navigate(`/video-shadowing/processing/${lesson.id}`);
        }
      } else {
        // Paste direct video URL or a YouTube link.
        const parsed = validateMediaUrl(url);
        const isYouTube = parsed.kind === 'youtube';
        const lessonId = `lesson-${Date.now()}`;
        const now = new Date().toISOString();
        let hasSegments = false;
        if (subtitleFile) {
          const content = await subtitleFile.text();
          const segments = await createSubtitleParser(lessonId).parse(content);
          await segmentRepo.replaceForLesson(lessonId, segments);
          hasSegments = segments.length > 0;
        }
        await lessonRepo.save({
          id: lessonId,
          title: title.trim() || (isYouTube ? 'YouTube video' : 'Video link'),
          sourceType: isYouTube ? 'YouTube' : 'DirectUrl',
          provider: isYouTube ? 'YouTube' : undefined,
          providerItemId: isYouTube ? parsed.videoId : undefined,
          sourceUrl: parsed.url,
          durationMs: 0,
          level,
          topic,
          segmentMode: mode,
          transcriptSource: hasSegments ? 'UploadedSubtitle' : undefined,
          status: hasSegments ? 'Ready' : 'Draft',
          processingProgress: hasSegments ? 100 : 0,
          safetyStatus: 'UserProvided',
          createdAt: now,
          updatedAt: now,
        });
        // YouTube can't auto-extract audio → go straight to Review (subtitle or
        // manual segments). Other direct URLs without a subtitle go to processing.
        if (isYouTube) {
          if (!hasSegments) toast.info('Audio cannot be extracted from YouTube links — please add subtitles or manually add segments in the Review step.');
          navigate(`/video-shadowing/lessons/${lessonId}/review`);
        } else {
          navigate(hasSegments ? `/video-shadowing/lessons/${lessonId}/review` : `/video-shadowing/processing/${lessonId}`);
        }
      }
    } catch (err) {
      toast.error(toFriendlyError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const validateUrlField = (value: string) => {
    setUrl(value);
    if (!value.trim()) {
      setUrlError(null);
      return;
    }
    try {
      validateMediaUrl(value);
      setUrlError(null);
    } catch (err) {
      setUrlError(toFriendlyError(err).message);
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/video-shadowing')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to library
      </button>
      <h1 className="text-3xl font-bold mb-2 text-center">Add Video Shadowing</h1>
      <div className="flex justify-center mb-6"><PrivacyBadge /></div>
      <StepProgress current={0} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 max-w-5xl mx-auto">
        {/* Source column */}
        <div className="flex flex-col gap-5">
          {/* Source selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full">
            {([['upload', 'Upload Video', UploadCloud], ['link', 'Paste Video Link', Link2]] as const).map(([k, label, Icon]) => (
              <button
                key={k}
                onClick={() => setSource(k)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition',
                  source === k ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                )}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {source === 'upload' ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => videoInput.current?.click()}
              className="glass-card rounded-3xl border-2 border-dashed border-indigo-200 dark:border-indigo-500/40 bg-indigo-50/40 dark:bg-indigo-500/5 flex flex-col items-center justify-center text-center py-14 px-8 cursor-pointer hover:bg-indigo-50/70 dark:hover:bg-indigo-500/10 transition"
            >
              <input ref={videoInput} type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
              {videoFile ? (
                <div className="flex items-center gap-3">
                  <FileVideo className="w-8 h-8 text-indigo-500" />
                  <div className="text-left">
                    <p className="font-bold">{videoFile.name}</p>
                    <p className="text-xs text-slate-500">{humanFileSize(videoFile.size)}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setVideoFile(null); }} className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-indigo-500 mb-4">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-lg mb-1">Drag & drop video here</p>
                  <p className="text-sm text-slate-500 mb-4">or click to select from your device · MP4, WebM, MOV · up to 300MB</p>
                  <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold">Choose file</span>
                </>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-6 flex flex-col gap-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Direct video / audio URL</label>
              <input
                value={url}
                onChange={(e) => validateUrlField(e.target.value)}
                placeholder="https://youtube.com/watch?v=...  or  https://example.com/clip.mp4"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/40"
              />
              {urlError && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {urlError}</p>}
              <p className="text-xs text-slate-400 leading-relaxed">
                Supports <b>YouTube links</b> (plays via official embed — requires .srt/.vtt subtitles for scripts as audio cannot be extracted), or direct https link to .mp4/.webm/.mov/.mp3 (CORS enabled). TikTok/Facebook not supported.
                Only use videos that you have permission to access and practice with.
              </p>
            </div>
          )}

          {/* Subtitle (optional) */}
          <div className="glass-card rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
            <input ref={subInput} type="file" accept=".srt,.vtt" className="hidden" onChange={(e) => setSubtitleFile(e.target.files?.[0] ?? null)} />
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0"><Captions className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Upload subtitle <span className="text-slate-400 font-normal">(optional)</span></p>
              <p className="text-xs text-slate-500 truncate">{subtitleFile ? subtitleFile.name : '.srt or .vtt — helps generate more accurate scripts without AI generation'}</p>
            </div>
            {subtitleFile ? (
              <button onClick={() => setSubtitleFile(null)} className="px-3 py-2 text-sm font-medium text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg">Remove</button>
            ) : (
              <button onClick={() => subInput.current?.click()} className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-500/15 rounded-lg">Browse</button>
            )}
          </div>

          {durationWarning && (
            <div className="flex items-start gap-2 text-xs text-orange-600 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> Video is quite long — processing may be slow. Recommended to use videos under 15 minutes.
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Settings column */}
        <div className="glass-card rounded-3xl p-6 flex flex-col gap-5 h-fit">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Level" value={level} options={LEVELS} onChange={(v) => setLevel(v as LessonLevel)} />
            <SelectField label="Topic" value={topic} options={TOPICS} onChange={setTopic} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Segment mode</label>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition',
                    mode === value ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800',
                  )}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>
          <button
            disabled={!canGenerate}
            onClick={handleGenerate}
            className="mt-2 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 disabled:cursor-not-allowed hover:brightness-110 transition"
          >
            <Sparkles className="w-5 h-5" /> {busy || importing ? 'Processing...' : 'Generate Shadow Lesson'}
          </button>
          <p className="text-[11px] text-slate-400 text-center">Has subtitles → Go to Review immediately. No subtitles → Generate script locally using AI on your machine.</p>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">{label}</label>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </Select>
    </div>
  );
}
