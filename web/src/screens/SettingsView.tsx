import { Save, AudioLines, BrainCircuit, Sun, Moon, Monitor, Target } from 'lucide-react';
import { useSettings } from '../components/useSettings';
import { useToast } from '../components/useToast';
import { useTheme } from '../components/useTheme';
import { cn } from '../components/classNames';
import type { AIProvider, PrimaryExam } from '../components/settings-context';

const SettingsView = () => {
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const {
    aiProvider, setAiProvider,
    primaryExam, setPrimaryExam,
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
        {/* Learning target */}
        <section className="glass-card rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" /> Learning Target
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Speaking and Writing use this exam format across the app.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { value: 'IELTS' as const, title: 'IELTS', sub: 'Band 0-9 · Speaking parts 1-3 · Writing tasks 1-2', accent: 'cyan' },
              { value: 'TOEIC' as const, title: 'TOEIC', sub: 'Speaking 11 questions · Writing 8 questions', accent: 'blue' },
            ]).map((opt) => {
              const active = primaryExam === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setPrimaryExam(opt.value as PrimaryExam)}
                  className={cn(
                    'text-left rounded-2xl border p-5 transition-all',
                    active
                      ? 'bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider',
                      opt.accent === 'cyan'
                        ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    )}>
                      {opt.title}
                    </span>
                    {active && <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Active</span>}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{opt.sub}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Theme */}
        <section className="glass-card rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-indigo-500" />} Appearance
          </h2>
          <div className="flex gap-3">
            {([
              { value: 'light' as const, icon: Sun, label: 'Light' },
              { value: 'dark' as const, icon: Moon, label: 'Dark' },
              { value: 'system' as const, icon: Monitor, label: 'System' },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all",
                  theme === opt.value
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* AI Models */}
        <section className="glass-card rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-indigo-500" /> AI Provider & Models</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">AI Provider</label>
              <select 
                value={aiProvider}
                onChange={(e) => {
                  const newProvider = e.target.value as AIProvider;
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
