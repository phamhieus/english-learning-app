import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useSettings } from './SettingsContext';
import { Key, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { aiProvider, geminiKey, openAiKey, deepseekKey } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hasKey =
    (aiProvider === 'gemini' && geminiKey) ||
    (aiProvider === 'openai' && openAiKey) ||
    (aiProvider === 'deepseek' && deepseekKey);

  if (!hasKey && location.pathname !== '/settings') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--background)] p-6">
        <div className="glass-card rounded-3xl p-10 max-w-md w-full text-center shadow-xl animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Key className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-3">API Key Required</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Please enter your {aiProvider === 'gemini' ? 'Google Gemini' : aiProvider === 'openai' ? 'OpenAI' : 'DeepSeek'} API key in the settings to start using the AI English Coach.
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
    <div className="flex h-screen w-full overflow-hidden bg-[var(--background)] selection:bg-indigo-200 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[var(--sidebar)] border-b border-[var(--border)] flex items-center px-4 gap-3 z-40 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg tracking-tight text-[var(--foreground)]">EngCoach</h1>
      </div>

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

      <main className="flex-1 overflow-y-auto px-4 py-4 pt-16 md:px-10 md:py-8 md:pt-8 relative">
        <div
          key={location.pathname}
          className="max-w-6xl mx-auto w-full h-full pb-10 animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both"
        >
          {children}
        </div>
      </main>
    </div>
  );
};
