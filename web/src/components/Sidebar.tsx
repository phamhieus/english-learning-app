import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mic2, Edit3, History, Settings, Headphones } from 'lucide-react';
import { cn } from './classNames';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Speaking',  icon: Mic2,            path: '/speaking' },
  { name: 'Shadowing', icon: Headphones,      path: '/shadowing' },
  { name: 'Writing',   icon: Edit3,           path: '/writing' },
  { name: 'History',   icon: History,         path: '/history' },
  { name: 'Settings',  icon: Settings,        path: '/settings' },
];

export const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <aside className="w-[280px] shrink-0 h-full bg-[var(--sidebar)] border-r border-[var(--border)] flex flex-col pt-8 pb-6 px-4 relative z-10">

      {/* ── Brand ─────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-3 mb-10 animate-in slide-in-from-left-6 fade-in duration-500"
        style={{ animationFillMode: 'both' }}
      >
        <img src="/icon.svg" alt="Lingua" className="w-14 h-14 shrink-0" />
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight text-[var(--foreground)]">
            Lingua
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">
            AI Native
          </p>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────── */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item, index) => {
          const active = isActive(item.path);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              onClick={onNavigate}
              style={{
                animationDelay: `${index * 60 + 80}ms`,
                animationFillMode: 'both',
              }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-300 group relative overflow-hidden',
                'animate-in slide-in-from-left-4 fade-in duration-400',
                active
                  ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-md shadow-indigo-500/5 border border-slate-200/50 dark:border-slate-700/50 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full shadow-lg shadow-indigo-500/50" />
              )}
              <item.icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-colors duration-300',
                  active ? 'text-indigo-500' : 'opacity-80 group-hover:opacity-100'
                )}
              />
              <span className="tracking-wide">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
