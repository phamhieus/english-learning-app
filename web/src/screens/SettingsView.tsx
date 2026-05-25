import React from 'react';
import { Moon, Sun, Monitor, Save, AudioLines, BrainCircuit } from 'lucide-react';
import { useTheme } from '../components/ThemeContext';
import { useSettings } from '../components/SettingsContext';
import { useToast } from '../components/ToastContext';
import { cn } from '../components/Sidebar';

const SettingsView = () => {
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const { 
    aiProvider, setAiProvider, 
    geminiKey, setGeminiKey, 
    openAiKey, setOpenAiKey, 
    deepseekKey, setDeepseekKey, 
    textModel, setTextModel 
  } = useSettings();

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your preferences and API connections.</p>
      </div>

      <div className="space-y-8">


        {/* AI Models */}
        <section className="glass-card rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-indigo-500" /> AI Provider & Models</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">AI Provider</label>
              <select 
                value={aiProvider}
                onChange={(e) => {
                  const newProvider = e.target.value as any;
                  setAiProvider(newProvider);
                  if (newProvider === 'gemini') setTextModel('gemini-2.0-flash');
                  if (newProvider === 'openai') setTextModel('gpt-4o-mini');
                  if (newProvider === 'deepseek') setTextModel('deepseek-v4-flash');
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all font-medium"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="deepseek">DeepSeek</option>
              </select>
            </div>

            {aiProvider === 'gemini' && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Gemini API Key
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline ml-2 font-normal text-xs">
                    (Get your API key here)
                  </a>
                </label>
                <input 
                  type="password" 
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>
            )}

            {aiProvider === 'openai' && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  OpenAI API Key
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline ml-2 font-normal text-xs">
                    (Get your API key here)
                  </a>
                </label>
                <input 
                  type="password" 
                  placeholder="sk-..."
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>
            )}

            {aiProvider === 'deepseek' && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  DeepSeek API Key
                  <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline ml-2 font-normal text-xs">
                    (Get your API key here)
                  </a>
                </label>
                <input 
                  type="password" 
                  placeholder="sk-..."
                  value={deepseekKey}
                  onChange={(e) => setDeepseekKey(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Default Text Model</label>
              <select 
                value={textModel}
                onChange={(e) => setTextModel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all"
              >
                {aiProvider === 'gemini' && (
                  <>
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                  </>
                )}
                {aiProvider === 'openai' && (
                  <>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="o1-mini">o1-mini</option>
                  </>
                )}
                {aiProvider === 'deepseek' && (
                  <>
                    <option value="deepseek-v4-flash">deepseek-v4-flash</option>
                    <option value="deepseek-v4-pro">deepseek-v4-pro</option>
                  </>
                )}
              </select>
            </div>
            
            <p className="text-xs text-slate-500 mt-2">Your keys are stored locally on your device and never sent to our servers.</p>
          </div>
        </section>

        {/* Audio API */}
        <section className="glass-card rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><AudioLines className="w-5 h-5 text-indigo-500" /> Local Audio API</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Whisper / TTS Local URL</label>
              <input 
                type="text" 
                placeholder="http://localhost:8080"
                defaultValue="http://127.0.0.1:8000"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
               <div>
                 <p className="font-semibold text-sm">Save audio recordings locally</p>
                 <p className="text-xs text-slate-500">Keep history of your speaking practice.</p>
               </div>
               <div className="w-12 h-6 bg-indigo-500 rounded-full relative cursor-pointer">
                 <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
               </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
           <button 
             onClick={() => toast.success('Settings saved successfully!')}
             className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
           >
             <Save className="w-5 h-5" /> Save Changes
           </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
