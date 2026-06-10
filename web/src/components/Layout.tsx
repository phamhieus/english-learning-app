import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Key, Home, Mic2, Repeat2, Edit3, Menu } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from './classNames';
import { useSettings } from './useSettings';
import { hasApiKey, PROVIDER_LABEL } from './settings-context';

// Primary mobile destinations; full nav lives behind the "More" drawer.
const MOBILE_TABS = [
  { name: 'Home', icon: Home, path: '/' },
  { name: 'Speaking', icon: Mic2, path: '/speaking' },
  { name: 'Shadowing', icon: Repeat2, path: '/shadowing' },
  { name: 'Writing', icon: Edit3, path: '/writing' },
] as const;

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const settings = useSettings();
  const { aiProvider } = settings;
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hasKey = hasApiKey(settings);

  // Shadowing lets users choose local video shadowing before they need a cloud AI key.
  const keyExempt =
    location.pathname === '/settings' ||
    location.pathname.startsWith('/shadowing') ||
    location.pathname.startsWith('/video-shadowing');

  if (!hasKey && !keyExempt) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--background)] p-6">
        <div className="glass-card rounded-3xl p-10 max-w-md w-full text-center shadow-xl animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Key className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-3">API Key Required</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Please enter your {PROVIDER_LABEL[aiProvider]} API key in the settings to start using the AI English Coach.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[var(--background)] selection:bg-indigo-200 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:static md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28 md:px-10 md:py-8 md:pb-8 relative">
        <div
          key={location.pathname}
          className="max-w-6xl mx-auto w-full min-h-full pb-10 animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both"
        >
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar (replaces the desktop sidebar on phones) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[var(--card)]/95 backdrop-blur-xl border-t border-[var(--border)] px-2 pt-2" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-around">
          {MOBILE_TABS.map((t) => {
            const active = t.path === '/' ? location.pathname === '/' : location.pathname.startsWith(t.path);
            return (
              <NavLink
                key={t.name}
                to={t.path}
                end={t.path === '/'}
                className={cn('flex flex-col items-center gap-1 px-3 py-1 rounded-xl', active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400')}
              >
                <t.icon className={cn('w-6 h-6', active && 'text-indigo-500')} />
                <span className="text-[10px] font-semibold">{t.name}</span>
              </NavLink>
            );
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-slate-400"
          >
            <Menu className="w-6 h-6" />
            <span className="text-[10px] font-semibold">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
