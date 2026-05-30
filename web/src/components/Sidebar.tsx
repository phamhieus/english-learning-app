import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mic2, Edit3, History, Settings, MessageSquare, Headphones, Clapperboard } from 'lucide-react';
import { cn } from './classNames';
import { useLayoutEffect, useRef, useState } from 'react';

const navItems = [
  { name: 'Dashboard',    icon: LayoutDashboard, path: '/' },
  { name: 'Speaking',     icon: Mic2,            path: '/speaking' },
  { name: 'Shadowing',    icon: Headphones,      path: '/shadowing' },
  { name: 'Video Shadowing', icon: Clapperboard, path: '/video-shadowing' },
  { name: 'Conversation', icon: MessageSquare,   path: '/speaking/virtual-conversation' },
  { name: 'Writing',      icon: Edit3,           path: '/writing' },
  { name: 'History',      icon: History,         path: '/history' },
  { name: 'Settings',     icon: Settings,        path: '/settings' },
];

// The most specific (longest) matching path wins, so /speaking/virtual-conversation
// does not also light up /speaking.
const matchScore = (pathname: string, itemPath: string) => {
  if (itemPath === '/') return pathname === '/' ? 1 : 0;
  if (pathname === itemPath) return itemPath.length + 1;
  if (pathname.startsWith(itemPath + '/')) return itemPath.length;
  return 0;
};

export const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();

  const bestScore = Math.max(...navItems.map((i) => matchScore(location.pathname, i.path)));
  const isActive = (path: string) =>
    bestScore > 0 && matchScore(location.pathname, path) === bestScore;

  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  useLayoutEffect(() => {
    const update = () => {
      const activeEl = navRef.current?.querySelector('[data-active="true"]') as HTMLElement | null;
      if (!activeEl) {
        setIndicatorStyle((s) => ({ ...s, opacity: 0 }));
        return;
      }
      setIndicatorStyle({
        top: activeEl.offsetTop,
        height: activeEl.offsetHeight,
        opacity: 1,
      });
    };
    update();
    const raf = requestAnimationFrame(() => setHasMoved(true));
    const t = setTimeout(update, 80);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [location.pathname]);

  return (
    <aside className="w-[280px] shrink-0 h-full bg-[var(--sidebar)] border-r border-[var(--border)] flex flex-col pt-8 pb-6 px-4 relative z-10">
      {/* ── Brand ─────────────────────────────────── */}
      <div
        className="flex flex-col items-center gap-2 px-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-700"
        style={{ animationFillMode: 'both' }}
      >
        <img
          src="/icon.svg"
          alt="Lingua"
          className="w-28 h-28 shrink-0 drop-shadow-[0_8px_24px_rgba(156,102,250,0.35)] animate-[sb-bob_4s_ease-in-out_infinite]"
        />
        <div className="text-center">
          <h1 className="font-bold text-xl leading-tight tracking-tight text-[var(--foreground)]">
            Lingua
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-[0.18em] uppercase">
            AI Native
          </p>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────── */}
      <nav ref={navRef} className="flex-1 flex flex-col gap-2 relative">
        {/* Floating active indicator — animates between items */}
        <div
          aria-hidden
          className={cn(
            'absolute left-0 right-0 rounded-2xl bg-white dark:bg-slate-800 shadow-md shadow-indigo-500/5 border border-slate-200/50 dark:border-slate-700/50 pointer-events-none',
            hasMoved ? 'transition-[top,height,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]' : ''
          )}
          style={{
            top: indicatorStyle.top,
            height: indicatorStyle.height,
            opacity: indicatorStyle.opacity,
          }}
        />

        {navItems.map((item, index) => {
          const active = isActive(item.path);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              onClick={onNavigate}
              data-active={active ? 'true' : 'false'}
              style={{
                animationDelay: `${index * 55 + 80}ms`,
                animationFillMode: 'both',
              }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl font-medium group relative overflow-hidden z-10',
                'animate-in slide-in-from-left-6 fade-in duration-500',
                'transition-[color,transform] duration-300 ease-out',
                active
                  ? 'text-indigo-600 dark:text-indigo-400 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-0.5'
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full shadow-lg shadow-indigo-500/50 animate-in fade-in slide-in-from-left-2 duration-300"
                />
              )}
              <item.icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-all duration-300',
                  active
                    ? 'text-indigo-500 scale-110'
                    : 'opacity-80 group-hover:opacity-100 group-hover:scale-105'
                )}
              />
              <span className="tracking-wide">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <style>{`
        @keyframes sb-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
      `}</style>
    </aside>
  );
};
