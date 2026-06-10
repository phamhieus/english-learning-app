import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mic2, Edit3, Activity, Settings, Repeat2, Clapperboard, Flame, Target, MessageSquareHeart, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './classNames';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useUserStats } from '../services/useUserStats';

const navItems = [
  { name: 'Dashboard',         icon: LayoutDashboard,    path: '/' },
  { name: 'Speaking',          icon: Mic2,               path: '/speaking' },
  { name: 'Writing',           icon: Edit3,              path: '/writing' },
  { name: 'Shadowing',         icon: Repeat2,            path: '/shadowing' },
  { name: 'Video Shadowing',   icon: Clapperboard,       path: '/video-shadowing' },
  { name: 'Learning Progress', icon: Activity,           path: '/progress' },
  { name: 'Settings',          icon: Settings,           path: '/settings' },
  { name: 'Feedback',          icon: MessageSquareHeart, path: '/feedback' },
];

const matchScore = (pathname: string, itemPath: string) => {
  if (itemPath === '/') return pathname === '/' ? 1 : 0;
  if (pathname === itemPath) return itemPath.length + 1;
  if (pathname.startsWith(itemPath + '/')) return itemPath.length;
  return 0;
};

function readStored(): boolean | null {
  try {
    const v = localStorage.getItem('sidebar.collapsed');
    return v === null ? null : v === '1';
  } catch { return null; }
}

function saveStored(v: boolean) {
  try { localStorage.setItem('sidebar.collapsed', v ? '1' : '0'); } catch {}
}

export const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();
  const stats = useUserStats();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const stored = readStored();
    if (stored !== null) return stored;
    return typeof window !== 'undefined' && window.innerWidth < 1024;
  });

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // Auto-collapse when viewport enters the md range (768–1023 px)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const h = (e: MediaQueryListEvent) => {
      if (e.matches) { setCollapsed(true); saveStored(true); }
    };
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => { saveStored(!c); return !c; });
  };

  // Mobile drawer always shows the full sidebar
  const isCollapsed = !isMobile && collapsed;

  const goals = (
    [
      { exam: 'IELTS', target: 7.0, est: stats.ieltsEst },
      { exam: 'TOEIC', target: 800, est: stats.toeicEst },
    ] as const
  ).map((g) => ({
    exam: g.exam,
    target: g.target,
    now: g.est !== null ? g.est : 0,
    pct: g.est !== null ? Math.min(100, Math.round((g.est / g.target) * 100)) : 0,
  }));

  const bestScore = Math.max(...navItems.map((i) => matchScore(location.pathname, i.path)));
  const isActive = (path: string) =>
    bestScore > 0 && matchScore(location.pathname, path) === bestScore;

  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  useLayoutEffect(() => {
    const update = () => {
      const el = navRef.current?.querySelector('[data-active="true"]') as HTMLElement | null;
      if (!el) { setIndicatorStyle((s) => ({ ...s, opacity: 0 })); return; }
      setIndicatorStyle({ top: el.offsetTop, height: el.offsetHeight, opacity: 1 });
    };
    update();
    const raf = requestAnimationFrame(() => setHasMoved(true));
    const t = setTimeout(update, 80);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [location.pathname, isCollapsed]);

  return (
    <aside
      className={cn(
        'shrink-0 h-full bg-[var(--sidebar)] border-r border-[var(--border)] flex flex-col pt-8 pb-6 relative z-10',
        'transition-[width] duration-300 ease-in-out',
        isCollapsed ? 'w-[72px]' : 'w-[280px]',
      )}
      style={{ willChange: 'width' }}
    >

      {/* ── Collapse / expand toggle — tablet + desktop only ── */}
      <button
        onClick={toggleCollapsed}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="hidden md:flex absolute -right-3.5 top-10 z-20 w-7 h-7 rounded-full
          bg-white dark:bg-slate-800 border border-[var(--border)] shadow-md
          items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400
          hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors duration-200"
      >
        {isCollapsed
          ? <ChevronRight className="w-3.5 h-3.5" />
          : <ChevronLeft  className="w-3.5 h-3.5" />}
      </button>

      {/* ── Brand ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 mb-8 px-4 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700"
        style={{ animationFillMode: 'both' }}
      >
        <img
          src="/icon.svg"
          alt="Lingua"
          className={cn(
            'shrink-0 drop-shadow-[0_6px_16px_rgba(156,102,250,0.3)] animate-[sb-bob_4s_ease-in-out_infinite]',
            'transition-[width,height] duration-300',
            isCollapsed ? 'w-8 h-8' : 'w-12 h-12',
          )}
        />
        {/* Kept in DOM — opacity-only transition avoids layout mutation mid-animation */}
        <div
          className="min-w-0 transition-opacity duration-200 ease-in-out"
          style={{ opacity: isCollapsed ? 0 : 1 }}
          aria-hidden={isCollapsed}
        >
          <h1 className="font-bold text-xl leading-tight tracking-tight text-[var(--foreground)] whitespace-nowrap">
            Lingua
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-[0.18em] uppercase whitespace-nowrap">
            AI Native
          </p>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav ref={navRef} className="flex-1 flex flex-col gap-1.5 relative px-2">
        {/* Floating active-item highlight pill */}
        <div
          aria-hidden
          className={cn(
            'absolute left-1 right-1 rounded-2xl bg-white dark:bg-slate-800',
            'shadow-md shadow-indigo-500/5 border border-slate-200/50 dark:border-slate-700/50 pointer-events-none',
            hasMoved ? 'transition-[top,height,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]' : '',
          )}
          style={{ top: indicatorStyle.top, height: indicatorStyle.height, opacity: 1 }}
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
              // Native tooltip provides accessibility hint in collapsed mode
              title={isCollapsed ? item.name : undefined}
              style={{ animationDelay: `${index * 55 + 80}ms`, animationFillMode: 'both' }}
              className={cn(
                'group/item relative flex items-center gap-3 mx-1 px-3 py-3 rounded-2xl font-medium z-10 overflow-hidden',
                'animate-in slide-in-from-left-6 fade-in duration-500',
                'transition-colors duration-300 ease-out',
                active
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : cn('text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'),
              )}
            >
              {/* Left accent bar — visible only in expanded mode */}
              {active && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full shadow-lg shadow-indigo-500/50',
                    'transition-opacity duration-200',
                    isCollapsed ? 'opacity-0' : 'opacity-100',
                  )}
                />
              )}

              <item.icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-all duration-300',
                  active
                    ? 'text-indigo-500 scale-110'
                    : 'opacity-80 group-hover/item:opacity-100 group-hover/item:scale-105',
                )}
              />

              {/* Label — kept in DOM, opacity-only fade avoids any layout shift */}
              <span
                className="tracking-wide whitespace-nowrap transition-opacity duration-200 ease-in-out"
                style={{ opacity: isCollapsed ? 0 : 1 }}
                aria-hidden={isCollapsed}
              >
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── My goal card — kept in DOM, collapses via max-height + opacity ─ */}
      <div
        className="mx-1 overflow-hidden transition-[max-height,opacity,margin-top] duration-300 ease-in-out"
        style={{
          maxHeight: isCollapsed ? 0 : 240,
          opacity: isCollapsed ? 0 : 1,
          marginTop: isCollapsed ? 0 : '1rem',
        }}
        aria-hidden={isCollapsed}
      >
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-widest">My goal</p>
            <Target className="w-3.5 h-3.5 text-indigo-200" />
          </div>

          <div className="mt-3 space-y-3">
            {goals.map((g) => (
              <div key={g.exam}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[13px] font-bold">{g.exam}</span>
                  <span className="text-[12px] text-indigo-100 font-medium tabular-nums">
                    {g.now} <span className="text-indigo-200/70">/ {g.target}</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-[width] duration-500"
                    style={{ width: `${g.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3.5 pt-3 border-t border-white/15 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-50">
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            {`${stats.streak}-day streak`}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sb-bob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>
    </aside>
  );
};
