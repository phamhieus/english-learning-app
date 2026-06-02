import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';
import { cn } from './classNames';

/**
 * Text input for secrets (API keys, passwords) with a built-in show/hide eye
 * toggle. Manages its own visibility state; everything else forwards to <input>.
 */
export type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

const baseInput =
  'w-full rounded-xl px-4 py-3 pr-12 font-mono outline-none transition-all ' +
  'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 ' +
  'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

export const PasswordInput = ({ className, ...props }: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input type={visible ? 'text' : 'password'} className={cn(baseInput, className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide value' : 'Show value'}
        aria-pressed={visible}
        title={visible ? 'Hide' : 'Show'}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};
