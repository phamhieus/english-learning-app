import React, { useState } from 'react';
import { Play, Mic, Clock, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../components/Sidebar';

const FILTER_TYPES = ['1 Sentence', '2 Sentences', 'Paragraph', 'Passage'];
const FOCUS_TYPES = ['Pronunciation', 'Fluency', 'Both'];
const EXAM_TYPES = ['General', 'TOEIC', 'IELTS'];
const DIFFICULTY_TYPES = ['Easy', 'Medium', 'Hard'];

import { useSettings } from '../components/SettingsContext';
import { generatePracticeList } from '../services/ai';
import { getPractices, savePractices } from '../services/storage';
import { generateLocalPractices } from '../services/localData';
import type { Practice } from '../services/storage';

const FilterChip = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
      active
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
    )}
  >
    {label}
  </button>
);

const SpeakingList = () => {
  const navigate = useNavigate();
  const settings = useSettings();
  const [activeType, setActiveType] = useState('Paragraph');
  const [activeFocus, setActiveFocus] = useState('Fluency');
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const loadPractices = async () => {
      const category = `speaking_${activeType}_${activeFocus}`;
      const cached = getPractices(category);
      if (cached.length > 0) {
        setPractices(cached);
        setError(null);
      } else if (settings.aiProvider === 'gemini' ? settings.geminiKey : (settings.aiProvider === 'openai' ? settings.openAiKey : settings.deepseekKey)) {
        setLoading(true);
        setError(null);
        try {
          const newPractices = await generatePracticeList(settings, 'speaking', `${activeType} focusing on ${activeFocus}`);
          if (newPractices.length > 0) {
            savePractices(category, newPractices);
            setPractices(newPractices);
          }
        } catch (e: any) {
          setError(e?.message ?? 'Failed to generate practices.');
        } finally {
          setLoading(false);
        }
      }
    };
    loadPractices();
  }, [activeType, activeFocus, settings]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Speaking Practice</h1>
          <p className="text-slate-500 dark:text-slate-400">Improve your pronunciation and fluency with AI feedback.</p>
        </div>
        <button
          onClick={() => navigate('/speaking/mock-dialogue')}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          <Mic className="w-4 h-4" /> Try Mock Dialogue
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {FILTER_TYPES.map(f => (
            <FilterChip key={f} label={f} active={activeType === f} onClick={() => setActiveType(f)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {FOCUS_TYPES.map(f => (
            <FilterChip key={f} label={f} active={activeFocus === f} onClick={() => setActiveFocus(f)} />
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Generating exercises...</h3>
          <p className="text-slate-500 dark:text-slate-400">Gemini AI is crafting new practice materials.</p>
        </div>
      ) : practices.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2  xl:grid-cols-3 gap-6">
          {practices.map((practice) => (
            <div key={practice.id} className="glass-card dark:bg-gray-800 rounded-2xl shadow p-6 group hover:shadow-xl transition-all border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider",
                  practice.level === 'Easy' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    practice.level === 'Medium' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {practice.level}
                </span>
                <div className="flex gap-2">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-1 rounded-md font-medium">{practice.type}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4 line-clamp-2 leading-snug">{practice.title}</h3>

              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6 mt-auto">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {practice.duration}</span>
                <span className="flex items-center gap-1.5"><BarChart className="w-4 h-4" /> {practice.focus || activeFocus}</span>
              </div>

              <button
                onClick={() => navigate('/speaking/record', { state: { practice } })}
                className="w-full flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 py-3 rounded-xl font-semibold transition-colors mt-auto"
              >
                <Play className="w-4 h-4 fill-current" /> Start Practice
              </button>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-red-200 dark:border-red-800">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Could not load practices</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md">{error}</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📭</span>
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No practices available</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Please check your API key to generate new practices with AI.</p>
          <button
            onClick={() => {
              const local = generateLocalPractices('speaking', activeType);
              setPractices(local);
              savePractices(`speaking_${activeType}_${activeFocus}`, local);
            }}
            className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:scale-105 font-bold rounded-xl transition-all shadow-md"
          >
            Generate Offline Topics
          </button>
        </div>
      )}
    </div>
  );
};

export default SpeakingList;
