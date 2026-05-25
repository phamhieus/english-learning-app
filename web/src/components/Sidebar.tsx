import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mic2, Edit3, History, Settings, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Sidebar = () => {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const updateIndicator = () => {
      // Finding the active NavLink by matching current location
      // NavLink automatically adds 'active' class
      const activeEl = navRef.current?.querySelector('.active') as HTMLElement;
      if (activeEl) {
        setIndicatorStyle({
          top: activeEl.offsetTop,
          height: activeEl.offsetHeight,
          opacity: 1
        });
        // Use a small timeout to enable transitions only after initial paint
        if (!isInitialized) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setIsInitialized(true));
          });
        }
      }
    };
    
    updateIndicator();
    const t = setTimeout(updateIndicator, 100);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Speaking', icon: Mic2, path: '/speaking' },
    { name: 'Writing', icon: Edit3, path: '/writing' },
    { name: 'History', icon: History, path: '/history' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="w-[280px] shrink-0 h-full bg-[var(--sidebar)] border-r border-[var(--border)] flex flex-col pt-8 pb-6 px-4 transition-all duration-300 relative z-10">
      {/* Brand */}
      <div className="flex items-center gap-3 px-3 mb-10 animate-in slide-in-from-left-8 fade-in duration-700">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group cursor-pointer hover:scale-110 transition-transform">
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight text-[var(--foreground)]">EngCoach</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">AI Native</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav ref={navRef} className="flex-1 flex flex-col gap-2 relative">
        {/* Sliding Indicator */}
        <div 
          className={cn(
            "absolute left-0 right-0 bg-white dark:bg-slate-800 shadow-md shadow-indigo-500/5 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl z-0 pointer-events-none scale-[1.02]",
            isInitialized ? "transition-all duration-300 ease-out" : "transition-none"
          )}
          style={{ 
            top: `${indicatorStyle.top}px`, 
            height: `${indicatorStyle.height}px`, 
            opacity: indicatorStyle.opacity 
          }}
        />

        {navItems.map((item, index) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            style={{ animationDelay: `${index * 100 + 100}ms`, animationFillMode: 'both' }}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-300 group relative overflow-hidden z-10",
              "animate-in slide-in-from-left-8 fade-in duration-500",
              isActive 
                ? "text-indigo-600 dark:text-indigo-400 scale-[1.02]" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-1"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full shadow-lg shadow-indigo-500/50" />
                )}
                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-300", 
                  isActive ? "text-indigo-500" : "opacity-80 group-hover:opacity-100 group-hover:scale-110 group-hover:-rotate-6"
                )} />
                <span className="tracking-wide">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
};
