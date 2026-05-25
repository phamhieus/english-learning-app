import React, { useState } from 'react';
import { PenTool, Clock, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../components/Sidebar';

const FILTER_TYPES = ['Email', 'Short Report', 'Describe Picture', 'Chart Analysis', 'IELTS Task 1', 'IELTS Task 2', 'TOEIC Writing'];

import { useSettings } from '../components/SettingsContext';
import { generatePracticeList } from '../services/ai';
import { getPractices, savePractices } from '../services/storage';
import { generateLocalPractices } from '../services/localData';
import type { Practice } from '../services/storage';

const FilterChip = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border border-transparent",
      active 
        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-orange-200 dark:hover:border-orange-800"
    )}
  >
    {label}
  </button>
);

const WritingList = () => {
  const navigate = useNavigate();
  const settings = useSettings();
  const [activeType, setActiveType] = useState('Email');
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const loadPractices = async () => {
      const category = `writing_${activeType}`;
      const cached = getPractices(category);
      if (cached.length > 0) {
        setPractices(cached);
      } else if (settings.aiProvider === 'gemini' ? settings.geminiKey : (settings.aiProvider === 'openai' ? settings.openAiKey : settings.deepseekKey)) {
        setLoading(true);
        try {
          const newPractices = await generatePracticeList(settings, 'writing', activeType);
          if (newPractices.length > 0) {
            savePractices(category, newPractices);
            setPractices(newPractices);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    };
    loadPractices();
  }, [activeType, settings]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Writing Practice</h1>
        <p className="text-slate-500 dark:text-slate-400">Master grammar and vocabulary with Grammarly-style AI feedback.</p>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {FILTER_TYPES.map(f => (
            <FilterChip key={f} label={f} active={activeType === f} onClick={() => setActiveType(f)} />
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Generating exercises...</h3>
          <p className="text-slate-500 dark:text-slate-400">AI is crafting new practice materials.</p>
        </div>
      ) : practices.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {practices.map((practice) => (
            <div key={practice.id} className="glass-card dark:bg-gray-800 rounded-2xl shadow p-6 group hover:shadow-xl transition-all border border-transparent hover:border-orange-200 dark:hover:border-orange-800 flex flex-col">
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
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-1 rounded-md font-medium">{practice.type || activeType}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4 line-clamp-2 leading-snug">{practice.title}</h3>

              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6 mt-auto">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {practice.duration}</span>
              </div>

              <button
                onClick={() => navigate('/writing/editor', { state: { practice } })}
                className="w-full flex items-center justify-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-500 py-3 rounded-xl font-semibold transition-colors mt-auto"
              >
                <PenTool className="w-4 h-4 fill-current" /> Start Practice
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
             <span className="text-2xl">📭</span>
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No writing practices available</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Please check your API key to generate new practices with AI.</p>
          <button
            onClick={() => {
              const local = generateLocalPractices('writing', activeType);
              setPractices(local);
              savePractices(`writing_${activeType}`, local);
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

export default WritingList;
