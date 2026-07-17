import { useLocation, useNavigate } from 'react-router-dom';
import { Layers, X } from 'lucide-react';
import { cn } from '../../../components/classNames';
import { cancelCombo, getActiveCombo } from '../services/comboSession';

/**
 * Slim progress strip shown (via Layout) while a multi-part session is in
 * progress. Re-reads the combo state on every route change, which is exactly
 * when the combo advances.
 */
export const ComboBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const combo = getActiveCombo();

  // The builder already shows its own resume card — avoid doubling up.
  if (!combo || location.pathname === '/practice-combo') return null;

  const current = combo.parts[combo.currentIndex];
  const skillListRoute = combo.skill === 'writing' ? '/writing' : '/speaking';

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/80 dark:bg-indigo-900/20 px-4 py-2.5 text-sm">
      <span className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
        <Layers className="w-4 h-4" />
        <span className="hidden sm:inline">Multi-part test</span>
      </span>
      <span className="text-indigo-600/80 dark:text-indigo-300/80 font-medium truncate">
        Part {combo.currentIndex + 1}/{combo.parts.length} · {current?.label}
      </span>
      <span className="ml-auto flex items-center gap-1.5 shrink-0">
        {combo.parts.map((part, index) => (
          <span
            key={part.key}
            className={cn(
              'h-1.5 rounded-full transition-all',
              index < combo.currentIndex
                ? 'w-4 bg-indigo-500'
                : index === combo.currentIndex
                  ? 'w-6 bg-indigo-500 animate-pulse'
                  : 'w-4 bg-indigo-200 dark:bg-indigo-800',
            )}
          />
        ))}
      </span>
      <button
        onClick={() => {
          cancelCombo();
          navigate(skillListRoute);
        }}
        title="Exit multi-part test"
        className="shrink-0 p-1 rounded-lg text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
