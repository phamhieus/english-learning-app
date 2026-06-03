import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Home,
  Loader2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Mic2,
  Activity,
  Info,
} from 'lucide-react';
import { cn } from '../../../components/classNames';
import { useSettings } from '../../../components/useSettings';
import { useToast } from '../../../components/useToast';
import { evaluateIeltsP1Session } from '../../../services/ai';
import { saveIeltsP1Session, addHistory } from '../../../services/storage';
import type { IeltsP1SessionResult, IeltsP1CriterionResult } from '../../../services/ai';
import type { IeltsAnswerRecord, IeltsSpeakingMode } from '../types/ielts-speaking.types';

interface ResultInput {
  answers: IeltsAnswerRecord[];
  mode: IeltsSpeakingMode;
  durationSeconds: number;
  isMock: boolean;
}

// ── Band colour helpers ───────────────────────────────────────────────────────
function bandColor(band: number | null): string {
  if (band == null) return 'text-slate-400 dark:text-slate-500';
  if (band >= 7.5) return 'text-emerald-600 dark:text-emerald-400';
  if (band >= 6.5) return 'text-teal-600 dark:text-teal-400';
  if (band >= 5.5) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function bandBg(band: number | null): string {
  if (band == null) return 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700';
  if (band >= 7.5) return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40';
  if (band >= 6.5) return 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/40';
  if (band >= 5.5) return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40';
  return 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40';
}

function formatBand(band: number | null): string {
  return band != null ? band.toFixed(1) : '—';
}

// ── Criterion card ────────────────────────────────────────────────────────────
function CriterionCard({
  label,
  data,
  accentColor,
}: {
  label: string;
  data: IeltsP1CriterionResult;
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
      >
        <span className={cn('text-xs font-bold uppercase tracking-wider', accentColor)}>{label}</span>
        <div className="flex items-center gap-3">
          <span className={cn('text-xl font-black tabular-nums', bandColor(data.estimatedBand))}>
            {formatBand(data.estimatedBand)}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 bg-white dark:bg-slate-900 space-y-3 border-t border-slate-100 dark:border-slate-800">
          {data.strengths.length > 0 && (
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Strengths</p>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.issues.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Issues</p>
              <ul className="space-y-1">
                {data.issues.map((s, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5 shrink-0">⚠</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.usefulAlternatives && data.usefulAlternatives.length > 0 && (
            <div>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Useful Alternatives</p>
              <div className="flex flex-wrap gap-1.5">
                {data.usefulAlternatives.map((w, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.improvementTip && (
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">{data.improvementTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Coaching insight chip ─────────────────────────────────────────────────────
function CoachingInsightRow({ insight }: { insight: IeltsP1SessionResult['coachingInsights'][number] }) {
  const valueDisplay = (() => {
    if (insight.value == null) return null;
    if (Array.isArray(insight.value)) return (insight.value as string[]).join(', ') || null;
    if (typeof insight.value === 'number') return String(insight.value);
    return String(insight.value);
  })();

  const colorClass =
    insight.value === 'good' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' :
    insight.value === 'needs_work' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20' :
    insight.value === 'poor' ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20' :
    'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800';

  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{insight.label}</p>
        {insight.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{insight.message}</p>}
      </div>
      {valueDisplay && (
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full shrink-0', colorClass)}>
          {valueDisplay}
        </span>
      )}
    </div>
  );
}

// ── Question review card ──────────────────────────────────────────────────────
function QuestionReviewCard({ qr, index }: { qr: IeltsP1SessionResult['questionResults'][number]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('rounded-2xl border overflow-hidden', bandBg(qr.quickScore))}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between px-4 py-3 text-left"
      >
        <div className="flex-1 pr-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
            Q{index + 1} · {qr.topicName}
          </p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{qr.question}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('text-lg font-black tabular-nums', bandColor(qr.quickScore))}>
            {formatBand(qr.quickScore)}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 space-y-4">
          {/* Your answer */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Your Answer</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
              "{qr.transcript || '(no speech detected)'}"
            </p>
            <p className="text-xs text-slate-400 mt-1">{qr.durationSeconds}s</p>
          </div>

          {/* Detected issues */}
          {qr.detectedIssues.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1.5">Detected Issues</p>
              <div className="space-y-1.5">
                {qr.detectedIssues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 shrink-0">
                      {issue.type}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{issue.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Corrected */}
          {qr.correctedTranscript && qr.correctedTranscript !== qr.transcript && (
            <div>
              <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1.5">Corrected Version</p>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-teal-50/60 dark:bg-teal-950/20 px-3 py-2 rounded-xl">
                {qr.correctedTranscript}
              </p>
            </div>
          )}

          {/* Improved */}
          <div>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />Reference Answer (Band 7)
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-indigo-50/60 dark:bg-indigo-950/20 px-3 py-2 rounded-xl">
              {qr.improvedAnswer}
            </p>
          </div>

          {/* Pronunciation words */}
          {qr.pronunciationWords.length > 0 && (
            <div>
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1.5">
                <Mic2 className="w-3.5 h-3.5 inline mr-1" />Practise Pronouncing
              </p>
              <div className="flex flex-wrap gap-1.5">
                {qr.pronunciationWords.map((pw, i) => (
                  <span
                    key={i}
                    title={pw.issue}
                    className="px-2 py-0.5 rounded-full text-xs bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 font-medium"
                  >
                    {pw.word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main result page ──────────────────────────────────────────────────────────
const IeltsSpeakingP1Result = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const { error: showError } = useToast();
  const input = location.state as ResultInput | null;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<IeltsP1SessionResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  useEffect(() => {
    if (!input?.answers?.length) {
      navigate('/speaking/ielts-p1');
      return;
    }

    const run = async () => {
      try {
        const res = await evaluateIeltsP1Session(settings, input.answers, input.durationSeconds);
        setResult(res);
        saveIeltsP1Session(res);
        addHistory({
          title: res.sessionTitle,
          type: 'IELTS Speaking Part 1',
          score: res.estimatedBand != null ? Math.round(res.estimatedBand * 10) : 0,
          focus: 'Speaking',
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Evaluation failed';
        setErr(msg);
        showError(msg);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-medium">Evaluating your session…</p>
        <p className="text-xs text-slate-400">AI is scoring all {input?.answers.length ?? 0} answers</p>
      </div>
    );
  }

  if (err || !result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <p className="text-slate-700 dark:text-slate-200 font-semibold">Could not evaluate session</p>
        <p className="text-sm text-slate-400">{err}</p>
        <button
          onClick={() => navigate('/speaking/ielts-p1')}
          className="mt-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
        >
          Back to lobby
        </button>
      </div>
    );
  }

  const { criteria, questionResults, coachingInsights } = result;
  const visibleQuestions = showAllQuestions ? questionResults : questionResults.slice(0, 4);
  const mins = Math.floor(result.durationSeconds / 60);
  const secs = result.durationSeconds % 60;

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-400">

      {/* ── Title ──────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Session Complete</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 text-slate-800 dark:text-slate-100">
          IELTS Speaking Part 1
        </h1>
        <p className="text-sm text-slate-400">
          {result.questionCount} question{result.questionCount !== 1 ? 's' : ''} · {result.topicCount} topic{result.topicCount !== 1 ? 's' : ''} · {mins}:{String(secs).padStart(2, '0')}
        </p>
      </div>

      {/* ── Estimated band ────────────────────────────────────── */}
      <div className={cn('rounded-3xl border p-6 text-center mb-6 shadow-sm', bandBg(result.estimatedBand))}>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Estimated Practice Band</p>
        <div className={cn('text-7xl font-black tabular-nums mb-2', bandColor(result.estimatedBand))}>
          {formatBand(result.estimatedBand)}
        </div>
        <div className="flex items-start justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>{result.disclaimer}</p>
        </div>
      </div>

      {/* ── Criterion bands ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { key: 'fluencyCoherence',          label: 'Fluency &\nCoherence',  icon: <Activity className="w-4 h-4" /> },
          { key: 'lexicalResource',            label: 'Lexical\nResource',    icon: <BookOpen className="w-4 h-4" /> },
          { key: 'grammaticalRangeAccuracy',   label: 'Grammar\nAccuracy',    icon: <Sparkles className="w-4 h-4" /> },
          { key: 'pronunciation',              label: 'Pronun-\nciation',     icon: <Mic2 className="w-4 h-4" /> },
        ].map(({ key, label, icon }) => {
          const crit = criteria[key as keyof typeof criteria];
          return (
            <div key={key} className="glass-card rounded-2xl p-3 text-center border border-transparent">
              <div className="text-slate-400 flex justify-center mb-1">{icon}</div>
              <div className={cn('text-2xl font-black tabular-nums', bandColor(crit.estimatedBand))}>
                {formatBand(crit.estimatedBand)}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 whitespace-pre-line leading-tight">{label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Key strengths & improvements ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {result.keyStrengths.length > 0 && (
          <div className="glass-card rounded-2xl p-4 border border-transparent">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Key Strengths</p>
            <ul className="space-y-1.5">
              {result.keyStrengths.map((s, i) => (
                <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-500 shrink-0 mt-0.5">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.priorityImprovements.length > 0 && (
          <div className="glass-card rounded-2xl p-4 border border-transparent">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Priority Improvements</p>
            <ul className="space-y-1.5">
              {result.priorityImprovements.map((s, i) => (
                <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                  <span className="text-amber-500 shrink-0 mt-0.5">→</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Coaching insights ─────────────────────────────────── */}
      {coachingInsights.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Coaching Insights</h2>
          <div className="glass-card rounded-2xl p-4 border border-transparent">
            {coachingInsights.map((insight, i) => (
              <CoachingInsightRow key={insight.key ?? i} insight={insight} />
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">These coaching insights are practice guidance, not official IELTS criteria.</p>
        </div>
      )}

      {/* ── Criterion detail accordions ───────────────────────── */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Criterion Detail</h2>
        <div className="space-y-2">
          <CriterionCard label="Fluency and Coherence"             data={criteria.fluencyCoherence}          accentColor="text-indigo-600 dark:text-indigo-400" />
          <CriterionCard label="Lexical Resource"                  data={criteria.lexicalResource}           accentColor="text-teal-600 dark:text-teal-400" />
          <CriterionCard label="Grammatical Range and Accuracy"    data={criteria.grammaticalRangeAccuracy}  accentColor="text-violet-600 dark:text-violet-400" />
          <CriterionCard label="Pronunciation"                     data={criteria.pronunciation}             accentColor="text-rose-600 dark:text-rose-400" />
        </div>
      </div>

      {/* ── Question review ───────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Question Review</h2>
        <div className="space-y-2">
          {visibleQuestions.map((qr, i) => (
            <QuestionReviewCard key={qr.questionId || i} qr={qr} index={i} />
          ))}
        </div>
        {questionResults.length > 4 && (
          <button
            onClick={() => setShowAllQuestions((v) => !v)}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors flex items-center justify-center gap-2"
          >
            {showAllQuestions ? (
              <><ChevronUp className="w-4 h-4" /> Show Less</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> Show All {questionResults.length} Questions</>
            )}
          </button>
        )}
      </div>

      {/* ── CTA buttons ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate('/speaking/ielts-p1')}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Practice Again
        </button>
        <button
          onClick={() => navigate('/speaking')}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-colors"
        >
          <Home className="w-4 h-4" /> Back to Speaking
        </button>
      </div>
    </div>
  );
};

export default IeltsSpeakingP1Result;
