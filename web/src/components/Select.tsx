import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from './classNames';

/**
 * Shared dropdown/combobox. Native <select> for accessibility + correct platform
 * behaviour, restyled into the app's soft-rounded indigo look: appearance-none,
 * custom chevron, indigo focus ring, full light/dark support.
 *
 * Usage is drop-in for a plain <select> — pass <option> children as usual.
 */
export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Wrapper element classes (e.g. width overrides). */
  wrapperClassName?: string;
};

const baseSelect =
  'w-full appearance-none cursor-pointer rounded-2xl px-4 py-3 pr-11 font-medium ' +
  'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 ' +
  'border border-slate-200 dark:border-slate-700 outline-none transition-all ' +
  'hover:border-indigo-300 dark:hover:border-indigo-500/50 ' +
  'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

export const Select = ({ className, wrapperClassName, children, ...props }: SelectProps) => (
  <div className={cn('relative', wrapperClassName)}>
    <select className={cn(baseSelect, className)} {...props}>
      {children}
    </select>
    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);
