import React from 'react';
import { Sidebar } from './Sidebar';
import { useSettings } from './SettingsContext';
import { Key } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { aiProvider, geminiKey, openAiKey, deepseekKey } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

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
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-10 py-8 relative">
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
