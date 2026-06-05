import { useMemo, useState } from 'react';
import {
  MessageSquareHeart,
  Lightbulb,
  Bug,
  Heart,
  MessageCircle,
  Mail,
  Send,
  Globe,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { cn } from '../components/classNames';

// ── Direct contact channels ──────────────────────────────────────────────────
const FB_TEAM_EMAIL = 'phamhieutb.dev@gmail.com';
const FB_TELEGRAM = 'https://t.me/Phamhieus';
const FB_FACEBOOK = 'https://www.facebook.com/phamhieu.dev/';

type FeedbackType = 'idea' | 'bug' | 'praise' | 'other';

const types: { key: FeedbackType; label: string; icon: typeof Lightbulb; accent: 'indigo' | 'red' | 'pink' | 'slate' }[] = [
  { key: 'idea', label: 'Idea / Suggestion', icon: Lightbulb, accent: 'indigo' },
  { key: 'bug', label: 'Bug Report', icon: Bug, accent: 'red' },
  { key: 'praise', label: 'Praise', icon: Heart, accent: 'pink' },
  { key: 'other', label: 'Other', icon: MessageCircle, accent: 'slate' },
];

const accentOnClass: Record<string, string> = {
  indigo: 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20',
  red: 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20',
  pink: 'bg-fuchsia-500 border-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20',
  slate: 'bg-slate-700 border-slate-700 text-white shadow-md shadow-slate-500/20',
};

const FeedbackView = () => {
  const [type, setType] = useState<FeedbackType>('idea');
  const [msg, setMsg] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');

  const activeType = types.find((t) => t.key === type) || types[0];

  const defaultSubject = `[Lingua · Feedback] ${activeType.label}`;
  const effectiveSubject = subject.trim() || defaultSubject;
  const body = useMemo(() => {
    const lines = [
      msg || '(Your feedback here…)',
      '',
      '—',
      `Type: ${activeType.label}`,
      email ? `Reply to: ${email}` : null,
      'Sent from Lingua · AI Native',
    ].filter(Boolean);
    return lines.join('\n');
  }, [msg, email, activeType.label]);

  const mailHref = `mailto:${FB_TEAM_EMAIL}?subject=${encodeURIComponent(effectiveSubject)}&body=${encodeURIComponent(body)}`;
  const tgHref = `${FB_TELEGRAM}?text=${encodeURIComponent(`${effectiveSubject}\n\n${body}`)}`;
  const fbHref = FB_FACEBOOK;

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 pb-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <MessageSquareHeart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">Send Feedback</h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl">
              Lingua gets better every day because of you. Share ideas, report bugs, or just say something kind — we read everything.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Compose */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-5 sm:p-8">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Your Feedback</h2>

            <div className="flex flex-wrap gap-2 mb-6">
              {types.map((t) => {
                const on = type === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setType(t.key)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-all',
                      on
                        ? accentOnClass[t.accent]
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    )}
                  >
                    <t.icon className="w-4 h-4" /> {t.label}
                  </button>
                );
              })}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
                Subject <span className="text-slate-400 font-normal">(auto-filled if left blank)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={defaultSubject}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors text-sm"
              />
            </div>

            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              rows={6}
              placeholder={
                type === 'bug'
                  ? 'Which screen did the bug occur on? What steps triggered it?'
                  : 'What would you like Lingua to improve? The more specific, the better.'
              }
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 outline-none text-[15px] leading-relaxed resize-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
            />

            <label className="block text-sm font-semibold mt-6 mb-2 text-slate-700 dark:text-slate-200">
              Your email <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email-account@example.com — so we can follow up"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3 outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Send actions */}
            <div className="mt-7 space-y-3">
              <a
                href={mailHref}
                className="flex items-center justify-center gap-2.5 bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors"
              >
                <Mail className="w-5 h-5" /> Send via Email
              </a>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={tgHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <Send className="w-5 h-5 text-sky-500" /> Telegram
                </a>
                <a
                  href={fbHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <Globe className="w-5 h-5 text-blue-600" /> Facebook
                </a>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              Pick a channel — your message will be pre-filled (Email &amp; Telegram).
            </p>
          </div>

          {/* Direct channels */}
          <div className="space-y-5">
            <div className="glass-card rounded-3xl p-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Direct Contact</h2>

              <a href={mailHref} className="flex items-center gap-4 p-3 -mx-1 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Email</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{FB_TEAM_EMAIL}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto group-hover:text-indigo-500 transition-colors" />
              </a>

              <div className="h-px bg-slate-100 dark:bg-slate-700/60 my-1" />

              <a href={FB_TELEGRAM} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-3 -mx-1 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Telegram</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">@Phamhieus</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto group-hover:text-sky-500 transition-colors" />
              </a>

              <div className="h-px bg-slate-100 dark:bg-slate-700/60 my-1" />

              <a href={FB_FACEBOOK} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-3 -mx-1 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Facebook</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">facebook.com/phamhieu.dev</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto group-hover:text-blue-600 transition-colors" />
              </a>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 p-6 text-white relative overflow-hidden">
              <div className="absolute -right-5 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              <Clock className="w-6 h-6 text-indigo-100 mb-3 relative" />
              <p className="font-bold text-lg leading-tight relative">Reply within 24 hours</p>
              <p className="text-sm text-indigo-100 mt-1.5 relative leading-relaxed">
                Small team, but we read every message. The best suggestions make it into the next update.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackView;
