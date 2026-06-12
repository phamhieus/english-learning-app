import { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';

interface ImprovedSampleCardProps {
  sample: string;
  label?: string;
}

export function ImprovedSampleCard({ sample, label = 'Improved Sample' }: ImprovedSampleCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-900/40">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-900/40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{label}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors"
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5" /> Copied</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copy</>
          )}
        </button>
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-xs text-slate-400 italic mb-3">
          This version preserves your ideas while improving clarity, grammar, and vocabulary to match your target level.
        </p>
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-serif bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
          {sample}
        </div>
      </div>
    </div>
  );
}
