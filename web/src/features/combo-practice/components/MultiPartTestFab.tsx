import { useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { cn } from '../../../components/classNames';
import type { ComboSkill } from '../types/combo-practice.types';

/**
 * Mobile-only floating shortcut to the multi-part test builder, pinned to the
 * bottom-right corner above the bottom tab bar. Desktop keeps the header
 * button on the list screens instead.
 */
export const MultiPartTestFab = ({ skill }: { skill: ComboSkill }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/practice-combo?skill=${skill}`)}
      className={cn(
        'sm:hidden fixed right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm text-white shadow-lg active:scale-95 transition-transform',
        skill === 'writing'
          ? 'bg-orange-500 shadow-orange-500/30'
          : 'bg-indigo-600 shadow-indigo-500/30',
      )}
      style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
    >
      <Layers className="w-4 h-4" /> Multi-Part Test
    </button>
  );
};
