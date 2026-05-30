// Reassures the user that processing is on-device (spec §14, §21).

import { ShieldCheck } from 'lucide-react';
import { cn } from '../../../components/classNames';

export function PrivacyBadge({ className, detail = true }: { className?: string; detail?: boolean }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 border border-green-100',
        'dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20 text-xs font-semibold',
        className,
      )}
    >
      <ShieldCheck className="w-4 h-4 shrink-0" />
      <span>Private — Processed on your device</span>
      {detail && <span className="hidden sm:inline font-normal opacity-80">· video của bạn không gửi lên cloud</span>}
    </div>
  );
}
