import { ChevronDown, Check } from 'lucide-react';
import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
  type ChangeEvent,
} from 'react';
import { cn } from './classNames';

/**
 * Shared dropdown/select control, restyled into a custom popover that matches
 * the EngCoach design language (glass menu, indigo accent, check-marked active
 * row, rotating chevron) — something a native <select> popup can't be styled to.
 *
 * It stays a drop-in replacement for a plain <select>: pass <option> children as
 * usual and an `onChange` handler that reads `e.target.value`. A minimal change
 * event is synthesised on selection so existing call sites keep working.
 */
type Accent = 'indigo' | 'orange';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Wrapper element classes (e.g. width overrides). */
  wrapperClassName?: string;
  /** Accent colour for the active row + focus ring. */
  accent?: Accent;
};

const ACCENT: Record<Accent, { text: string; bg: string; ring: string; border: string }> = {
  indigo: {
    text: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/25',
    ring: 'focus:ring-indigo-500/20',
    border: 'border-indigo-400 dark:border-indigo-500/60 ring-2 ring-indigo-500/20',
  },
  orange: {
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/25',
    ring: 'focus:ring-orange-500/20',
    border: 'border-orange-400 dark:border-orange-500/60 ring-2 ring-orange-500/20',
  },
};

type Opt = { value: string; label: string; disabled?: boolean };

// Flatten <option> / <optgroup> / fragment children into a plain option list.
function extractOptions(children: ReactNode): Opt[] {
  const out: Opt[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as { value?: unknown; children?: ReactNode; disabled?: boolean };
    if (child.type === 'option') {
      const value = String(props.value ?? '');
      const label = typeof props.children === 'string' ? props.children : String(props.children ?? value);
      out.push({ value, label, disabled: props.disabled });
    } else if (props.children) {
      // <optgroup> or React.Fragment — recurse into its children.
      out.push(...extractOptions(props.children));
    }
  });
  return out;
}

export const Select = ({
  className,
  wrapperClassName,
  children,
  value,
  onChange,
  disabled,
  accent = 'indigo',
}: SelectProps) => {
  const options = extractOptions(children);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const a = ACCENT[accent];

  const current = String(value ?? '');
  const selected = options.find((o) => o.value === current);
  const selLabel = selected?.label ?? '';

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (v: string) => {
    setOpen(false);
    if (v === current) return;
    // Synthesise the minimal shape existing callers read (`e.target.value`).
    onChange?.({ target: { value: v } } as ChangeEvent<HTMLSelectElement>);
  };

  return (
    <div className={cn('relative', wrapperClassName)} ref={rootRef}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 text-left font-medium rounded-xl px-4 py-3',
          'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200',
          'border outline-none transition-all focus:ring-2',
          a.ring,
          open ? a.border : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          className
        )}
      >
        <span className="truncate">{selLabel || 'Select…'}</span>
        <ChevronDown
          className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {/* Menu */}
      {open && (
        <div
          role="listbox"
          className={cn(
            'absolute z-50 left-0 right-0 mt-2 px-1.5 pt-1.5 pb-2.5 max-h-72 overflow-y-auto',
            'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl',
            'shadow-xl shadow-slate-300/40 dark:shadow-black/40',
            'animate-in fade-in zoom-in-95 duration-150 origin-top'
          )}
        >
          {options.map((o) => {
            const active = o.value === current;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                disabled={o.disabled}
                onClick={() => pick(o.value)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  active
                    ? cn(a.bg, a.text, 'font-semibold')
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                )}
              >
                <span className="flex-1 min-w-0 truncate text-sm">{o.label}</span>
                {active ? <Check className={cn('w-4 h-4 shrink-0', a.text)} /> : <span className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
