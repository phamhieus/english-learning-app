import { useEffect, useState, type ReactNode } from 'react';
import {
  Save,
  AudioLines,
  BrainCircuit,
  Sun,
  Moon,
  Monitor,
  Target,
  Volume2,
  VolumeX,
  Globe,
  Gauge,
  MessagesSquare,
  Timer,
  Mic2,
  LoaderCircle,
  ChevronDown,
} from 'lucide-react';
import { useSettings } from '../components/useSettings';
import { AiRuntimeSection } from '../features/ai-runtime/components/AiRuntimeSection';
import { useToast } from '../components/useToast';
import { useTheme } from '../components/useTheme';
import { cn } from '../components/classNames';
import { Select } from '../components/Select';
import { PasswordInput } from '../components/PasswordInput';
import type { AIProvider, PrimaryExam, UserAudioSettings } from '../components/settings-context';

// Providers shown in the Settings dropdown. Qwen / Moonshot / Zhipu are kept
// wired up in the backend (ai.ts registry + key storage) but hidden from the UI.
const PROVIDER_OPTIONS: { value: AIProvider; label: string }[] = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI (ChatGPT)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'grok', label: 'xAI (Grok)' },
];

// Sensible cheap/fast default selected when switching to a provider.
const PROVIDER_DEFAULT_MODEL: Record<AIProvider, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  deepseek: 'deepseek-chat',
  grok: 'grok-3-mini',
  qwen: 'qwen-plus',
  moonshot: 'moonshot-v1-8k',
  zhipu: 'glm-4-flash',
};

const MODELS_BY_PROVIDER: Record<AIProvider, { id: string; label: string }[]> = {
  gemini: [
    { id: 'gemini-2.0-flash-lite', label: 'gemini-2.0-flash-lite' },
    { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
    { id: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite' },
    { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
    { id: 'gemini-2.5-pro', label: 'gemini-2.5-pro (latest)' },
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'gpt-4o-mini' },
    { id: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
    { id: 'o3-mini', label: 'o3-mini' },
    { id: 'gpt-4o', label: 'gpt-4o' },
    { id: 'o4-mini', label: 'o4-mini' },
    { id: 'gpt-4.1', label: 'gpt-4.1' },
    { id: 'gpt-5-mini', label: 'gpt-5-mini' },
    { id: 'gpt-5', label: 'gpt-5 (latest)' },
  ],
  deepseek: [
    { id: 'deepseek-v4-flash', label: 'deepseek-v4-flash' },
    { id: 'deepseek-reasoner', label: 'deepseek-reasoner' },
    { id: 'deepseek-v4-pro', label: 'deepseek-v4-pro' },
  ],
  grok: [
    { id: 'grok-2-1212', label: 'grok-2' },
    { id: 'grok-3-mini', label: 'grok-3-mini' },
    { id: 'grok-3', label: 'grok-3' },
    { id: 'grok-4', label: 'grok-4 (latest)' },
  ],
  qwen: [
    { id: 'qwen-turbo', label: 'qwen-turbo' },
    { id: 'qwen2.5-72b-instruct', label: 'qwen2.5-72b-instruct' },
    { id: 'qwen-plus', label: 'qwen-plus' },
    { id: 'qwen-max', label: 'qwen-max (latest)' },
  ],
  moonshot: [
    { id: 'moonshot-v1-8k', label: 'moonshot-v1-8k' },
    { id: 'moonshot-v1-32k', label: 'moonshot-v1-32k' },
    { id: 'moonshot-v1-128k', label: 'moonshot-v1-128k' },
    { id: 'kimi-k2-0711-preview', label: 'kimi-k2 (latest)' },
  ],
  zhipu: [
    { id: 'glm-4-flash', label: 'glm-4-flash' },
    { id: 'glm-4-plus', label: 'glm-4-plus' },
    { id: 'glm-4.5', label: 'glm-4.5' },
    { id: 'glm-4.6', label: 'glm-4.6 (latest)' },
  ],
};

const KEY_META: Record<AIProvider, { label: string; link: string; placeholder: string }> = {
  gemini: { label: 'Gemini API Key', link: 'https://aistudio.google.com/app/apikey', placeholder: 'AIzaSy...' },
  openai: { label: 'OpenAI API Key', link: 'https://platform.openai.com/api-keys', placeholder: 'sk-...' },
  deepseek: { label: 'DeepSeek API Key', link: 'https://platform.deepseek.com/api_keys', placeholder: 'sk-...' },
  grok: { label: 'xAI (Grok) API Key', link: 'https://console.x.ai', placeholder: 'xai-...' },
  qwen: { label: 'Qwen (DashScope) API Key', link: 'https://bailian.console.alibabacloud.com/', placeholder: 'sk-...' },
  moonshot: { label: 'Moonshot (Kimi) API Key', link: 'https://platform.moonshot.cn/console/api-keys', placeholder: 'sk-...' },
  zhipu: { label: 'Zhipu (GLM) API Key', link: 'https://open.bigmodel.cn/usercenter/apikeys', placeholder: '...' },
};

const SettingsView = () => {
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const {
    aiProvider, setAiProvider,
    primaryExam, setPrimaryExam,
    geminiKey, setGeminiKey,
    openAiKey, setOpenAiKey,
    deepseekKey, setDeepseekKey,
    grokKey, setGrokKey,
    qwenKey, setQwenKey,
    moonshotKey, setMoonshotKey,
    zhipuKey, setZhipuKey,
    textModel, setTextModel,
    userAudioSettings, setUserAudioSettings
  } = useSettings();

  // Active provider's API-key value + setter, resolved from the registry above.
  const API_KEYS: Record<AIProvider, { value: string; set: (v: string) => void }> = {
    gemini: { value: geminiKey, set: setGeminiKey },
    openai: { value: openAiKey, set: setOpenAiKey },
    deepseek: { value: deepseekKey, set: setDeepseekKey },
    grok: { value: grokKey, set: setGrokKey },
    qwen: { value: qwenKey, set: setQwenKey },
    moonshot: { value: moonshotKey, set: setMoonshotKey },
    zhipu: { value: zhipuKey, set: setZhipuKey },
  };
  const activeKey = API_KEYS[aiProvider];
  const activeKeyMeta = KEY_META[aiProvider];

  const [isVoiceInitializing, setIsVoiceInitializing] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [supportedAccents, setSupportedAccents] = useState<UserAudioSettings['language'][]>(['en-US', 'en-GB']);
  const isVoiceReaderSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const isVoiceReaderOn = userAudioSettings.isVoiceReaderEnabled;
  const canConfigureVoiceReader = isVoiceReaderSupported && isVoiceReaderOn;
  const isAccentLocked = supportedAccents.length === 1;
  const updateAudio = (patch: Partial<UserAudioSettings>) => setUserAudioSettings(patch);

  useEffect(() => {
    if (!isVoiceReaderSupported || !window.speechSynthesis) return;
    let cancelled = false;

    const loadSupportedAccents = async () => {
      const accents = detectSupportedAccents(await waitForVoices(window.speechSynthesis));
      if (cancelled) return;
      setSupportedAccents(accents.length > 0 ? accents : ['en-US', 'en-GB']);
      if (accents.length === 1 && userAudioSettings.language !== accents[0]) {
        setUserAudioSettings({ language: accents[0] });
      }
    };

    loadSupportedAccents();
    window.speechSynthesis.addEventListener('voiceschanged', loadSupportedAccents);
    return () => {
      cancelled = true;
      window.speechSynthesis.removeEventListener('voiceschanged', loadSupportedAccents);
    };
  }, [isVoiceReaderSupported, setUserAudioSettings, userAudioSettings.language]);

  const previewVoice = async () => {
    if (!canConfigureVoiceReader || !window.speechSynthesis || isVoiceInitializing) return;
    setIsVoiceInitializing(true);
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const voices = await waitForVoices(synth);
      const utterance = new SpeechSynthesisUtterance('This is how EngCoach will read your practice aloud.');
      const matchingVoice = pickVoiceForLanguage(voices, userAudioSettings.language, userAudioSettings.voiceGender);
      utterance.lang = userAudioSettings.language;
      utterance.rate = userAudioSettings.speed;
      utterance.pitch = userAudioSettings.pitch;
      if (matchingVoice) utterance.voice = matchingVoice;
      synth.speak(utterance);
    } finally {
      setIsVoiceInitializing(false);
    }
  };

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

        {/* AI Runtime — Cloud AI vs Installed AI */}
        <section className="glass-card rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-indigo-500" /> AI Runtime</h2>

          <AiRuntimeSection
            cloudConfig={
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">AI Provider</label>
                  <Select
                    value={aiProvider}
                    onChange={(e) => {
                      const newProvider = e.target.value as AIProvider;
                      setAiProvider(newProvider);
                      setTextModel(PROVIDER_DEFAULT_MODEL[newProvider]);
                    }}
                  >
                    {PROVIDER_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                    {activeKeyMeta.label}
                    <a href={activeKeyMeta.link} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline ml-2 font-normal text-xs">
                      (Get your API key here)
                    </a>
                  </label>
                  <PasswordInput
                    placeholder={activeKeyMeta.placeholder}
                    value={activeKey.value}
                    onChange={(e) => activeKey.set(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Default Text Model</label>
                  <Select
                    value={textModel}
                    onChange={(e) => setTextModel(e.target.value)}
                  >
                    {MODELS_BY_PROVIDER[aiProvider].map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </Select>
                </div>

                <p className="text-xs text-slate-500 mt-2">Your keys are stored locally on your device and never sent to our servers.</p>
              </div>
            }
          />
        </section>

        {/* Audio & Voice Reader (collapsible) */}
        <section className="glass-card rounded-3xl p-5 sm:p-8">
          <button
            type="button"
            onClick={() => setIsAudioOpen((open) => !open)}
            aria-expanded={isAudioOpen}
            className="w-full flex items-start justify-between gap-3 text-left"
          >
            <span className="min-w-0">
              <span className="text-xl font-bold flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-indigo-500 shrink-0" /> Audio &amp; Voice Reader
              </span>
              <span className="block text-sm text-slate-500 dark:text-slate-400 mt-1">
                Control how EngCoach reads content aloud across the app.
              </span>
            </span>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-slate-400 shrink-0 mt-1 transition-transform duration-300',
                isAudioOpen && 'rotate-180'
              )}
            />
          </button>

          {isAudioOpen && (
          <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between gap-4 p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-11 h-11 rounded-2xl flex items-center justify-center transition-colors',
                  isVoiceReaderOn
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                )}
              >
                {isVoiceReaderOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-[15px]">Voice Reader</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Read questions, sample answers and dialogues aloud.
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={isVoiceReaderOn}
              disabled={!isVoiceReaderSupported}
              onClick={() => updateAudio({ isVoiceReaderEnabled: !isVoiceReaderOn })}
            />
          </div>

          <div
            className={cn(
              'mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity',
              !canConfigureVoiceReader && 'opacity-40 pointer-events-none select-none'
            )}
            aria-hidden={!canConfigureVoiceReader}
          >
            <AudioField icon={<Globe className="w-4 h-4" />} label="Accent" sub="Synthesised voice region">
              <SegmentedControl
                value={userAudioSettings.language}
                disabled={isAccentLocked}
                options={supportedAccents.map((accent) => ({
                  value: accent,
                  label: accent === 'en-GB' ? 'UK' : 'US',
                }))}
                onPick={(language) => updateAudio({ language })}
              />
            </AudioField>

            <AudioField icon={<Gauge className="w-4 h-4" />} label="Speed" sub="Playback rate">
              <SegmentedControl
                value={userAudioSettings.speed}
                options={[
                  { value: 0.75, label: '0.75x' },
                  { value: 1, label: '1x' },
                  { value: 1.25, label: '1.25x' },
                ]}
                onPick={(speed) => updateAudio({ speed })}
              />
            </AudioField>

            <AudioField icon={<Mic2 className="w-4 h-4" />} label="Speaker voice" sub="Best match from browser voices">
              <SegmentedControl
                value={userAudioSettings.voiceGender}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                ]}
                onPick={(voiceGender) => updateAudio({ voiceGender })}
              />
            </AudioField>

            <AudioField icon={<MessagesSquare className="w-4 h-4" />} label="Dialogue gap" sub="Pause between turns">
              <SegmentedControl
                value={userAudioSettings.dialogueGapMs}
                options={[
                  { value: 400, label: '0.4s' },
                  { value: 500, label: '0.5s' },
                  { value: 800, label: '0.8s' },
                ]}
                onPick={(dialogueGapMs) => updateAudio({ dialogueGapMs })}
              />
            </AudioField>

            <AudioField icon={<Timer className="w-4 h-4" />} label="Shadowing gap" sub="Pause before you repeat">
              <SegmentedControl
                value={userAudioSettings.shadowingGapMs}
                options={[
                  { value: 1000, label: '1.0s' },
                  { value: 2500, label: '2.5s' },
                  { value: 3000, label: '3.0s' },
                ]}
                onPick={(shadowingGapMs) => updateAudio({ shadowingGapMs })}
              />
            </AudioField>

            <AudioField icon={<Mic2 className="w-4 h-4" />} label="Preview voice" sub="Hear the current settings">
              <button
                type="button"
                onClick={previewVoice}
                disabled={!canConfigureVoiceReader || isVoiceInitializing}
                className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 disabled:cursor-not-allowed"
              >
                {isVoiceInitializing ? (
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                {isVoiceInitializing ? 'Loading voice' : 'Preview'}
              </button>
            </AudioField>
          </div>

          {!isVoiceReaderSupported ? (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700">
              <VolumeX className="w-3.5 h-3.5" /> Voice Reader is not supported on this device.
            </div>
          ) : !isVoiceReaderOn && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700">
              <VolumeX className="w-3.5 h-3.5" /> Voice Reader is disabled in Settings.
            </div>
          )}
          </div>
          )}
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

function ToggleSwitch({ checked, disabled, onClick }: { checked: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      role="switch"
      aria-checked={checked}
      className={cn(
        'w-12 h-6 rounded-full relative transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed',
        checked ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
      )}
    >
      <div
        className={cn(
          'w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-all',
          checked ? 'right-1' : 'left-1'
        )}
      />
    </button>
  );
}

function AudioField({
  icon,
  label,
  sub,
  children,
}: {
  icon: ReactNode;
  label: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm">{label}</p>
          <p className="text-xs text-slate-400">{sub}</p>
        </div>
      </div>
      <div className="w-full sm:w-auto sm:shrink-0">{children}</div>
    </div>
  );
}

function SegmentedControl<T extends string | number>({
  value,
  options,
  disabled,
  onPick,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  disabled?: boolean;
  onPick: (value: T) => void;
}) {
  return (
    <div className={cn('flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-full sm:w-auto', disabled && 'opacity-70')}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            disabled={disabled}
            onClick={() => onPick(option.value)}
            className={cn(
              'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap disabled:cursor-not-allowed',
              active
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function waitForVoices(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
  const loaded = synth.getVoices();
  if (loaded.length > 0) return Promise.resolve(loaded);

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      synth.removeEventListener('voiceschanged', finish);
      resolve(synth.getVoices());
    };

    synth.addEventListener('voiceschanged', finish);
    window.setTimeout(finish, 800);
  });
}

function pickVoiceForLanguage(
  voices: SpeechSynthesisVoice[],
  language: UserAudioSettings['language'],
  gender: UserAudioSettings['voiceGender'] = 'auto',
): SpeechSynthesisVoice | null {
  const target = language.toLowerCase();
  const normalize = (lang: string) => lang.toLowerCase().replace('_', '-');
  const accentHint = language === 'en-GB' ? /\b(uk|gb|british|england)\b/i : /\b(us|usa|american)\b/i;
  const accentVoices = voices.filter(
    (voice) =>
      normalize(voice.lang) === target ||
      normalize(voice.lang).startsWith(`${target}-`) ||
      (normalize(voice.lang).startsWith('en') && accentHint.test(voice.name)),
  );
  const genderVoice = findVoiceByGender(accentVoices, gender) ?? findVoiceByGender(voices, gender);

  return (
    genderVoice ??
    voices.find((voice) => normalize(voice.lang) === target) ??
    voices.find((voice) => normalize(voice.lang).startsWith(`${target}-`)) ??
    voices.find((voice) => normalize(voice.lang).startsWith('en') && accentHint.test(voice.name)) ??
    voices.find((voice) => normalize(voice.lang).startsWith('en')) ??
    null
  );
}

function findVoiceByGender(
  voices: SpeechSynthesisVoice[],
  gender: UserAudioSettings['voiceGender'],
): SpeechSynthesisVoice | null {
  if (gender === 'auto') return null;
  const femaleHint = /\b(female|woman|girl|zira|susan|hazel|samantha|victoria|karen|moira|tessa|serena|aria|jenny|michelle|emma|amy|libby|sonia)\b/i;
  const maleHint = /\b(male|man|boy|david|mark|george|daniel|alex|fred|tom|guy|ryan|brian|christopher|eric|roger)\b/i;
  const hint = gender === 'female' ? femaleHint : maleHint;
  return voices.find((voice) => normalizeVoiceLang(voice.lang).startsWith('en') && hint.test(voice.name)) ?? null;
}

function detectSupportedAccents(voices: SpeechSynthesisVoice[]): UserAudioSettings['language'][] {
  const englishVoices = voices.filter((voice) => normalizeVoiceLang(voice.lang).startsWith('en'));
  const hasUs = englishVoices.some((voice) => isUsVoice(voice));
  const hasUk = englishVoices.some((voice) => isUkVoice(voice));
  const accents: UserAudioSettings['language'][] = [];

  if (hasUs) accents.push('en-US');
  if (hasUk) accents.push('en-GB');
  if (accents.length > 0) return accents;

  return englishVoices.length === 1 ? ['en-US'] : [];
}

function normalizeVoiceLang(lang: string) {
  return lang.toLowerCase().replace('_', '-');
}

function isUsVoice(voice: SpeechSynthesisVoice) {
  return normalizeVoiceLang(voice.lang).startsWith('en-us') || /\b(us|usa|american)\b/i.test(voice.name);
}

function isUkVoice(voice: SpeechSynthesisVoice) {
  return normalizeVoiceLang(voice.lang).startsWith('en-gb') || /\b(uk|gb|british|england)\b/i.test(voice.name);
}

export default SettingsView;
