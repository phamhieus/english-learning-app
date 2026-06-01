import React, { useState, useEffect } from 'react';
import { Send, Clock, Type, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../components/classNames';
import { useSettings } from '../components/useSettings';
import { evaluateWriting } from '../services/ai';
import { addHistory } from '../services/storage';
import { useToast } from '../components/useToast';

const WritingEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const toast = useToast();
  const practice = location.state?.practice || { title: "Respond to a Customer Complaint", type: "Email" };
  const exam = (location.state?.exam as string) || '';
  const taskLabel = (location.state?.taskLabel as string) || 'Writing';
  
  const [text, setText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [timer, setTimer] = useState(600); // 10 mins
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTimer(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setWordCount(e.target.value.trim().split(/\s+/).filter(w => w.length > 0).length);
  };
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium">
          ← Exit
        </button>
        <div className="flex gap-2 items-center">
          {exam && (
            <span className={cn(
              'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
              exam === 'TOEIC' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
            )}>
              {exam}
            </span>
          )}
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full text-sm font-semibold">
            Writing · {taskLabel}
          </span>
        </div>
      </div>

      {(practice.image || practice.type?.toLowerCase().includes('picture')) && (
        <div className="mb-6 flex justify-center w-full shrink-0 relative">
          <img 
            src={practice.image || `https://loremflickr.com/800/450/${encodeURIComponent(practice.title.split(' ').slice(0,2).join(','))}?lock=${practice.id}`} 
            alt={practice.title} 
            className="w-full max-h-[400px] rounded-3xl shadow-lg object-cover" 
            onError={(e) => {
              if (e.currentTarget.src.includes('loremflickr')) {
                e.currentTarget.src = `https://picsum.photos/seed/${practice.id}/800/450`;
              } else {
                toast.error("Lỗi tải ảnh, vui lòng kiểm tra lại link ảnh!");
              }
            }}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Panel: Prompt */}
        <div className="w-full lg:w-1/3 glass-card rounded-3xl p-6 flex flex-col shrink-0 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">{practice.title}</h2>

       
        <h3 className="font-bold mb-3">Requirements</h3>
        <ul className="space-y-3 mb-6">
          <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Minimum 100 words
          </li>
          <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Professional tone
          </li>
          <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Clear instructions for return
          </li>
        </ul>
      </div>

      {/* Right Panel: Editor */}
      <div className="flex-1 glass-card rounded-3xl overflow-hidden flex flex-col relative border border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/50 dark:shadow-none">
        {/* Editor Toolbar */}
        <div className="h-14 border-b border-[var(--border)] px-6 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50">
          <div className="flex gap-4">
             <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500"><Type className="w-4 h-4" /> {wordCount} words</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-orange-500">
             <Clock className="w-4 h-4" /> {formatTime(timer)}
          </div>
        </div>

        {/* Text Area */}
        <textarea 
          className="flex-1 w-full bg-transparent p-6 resize-none outline-none text-lg leading-relaxed text-[var(--foreground)] placeholder:text-slate-400"
          placeholder="Dear John Doe..."
          value={text}
          onChange={handleChange}
          autoFocus
        />

        {/* Sticky Action Bar */}
        <div className="p-4 border-t border-[var(--border)] bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur shrink-0 flex justify-end">
          <button 
            onClick={async () => {
              setIsEvaluating(true);
              try {
                const result = await evaluateWriting(settings, practice.title, text);
                addHistory({ title: practice.title, type: practice.type, score: result.score, focus: 'Writing' });
                toast.success("Evaluation completed!");
                navigate('/writing/result', { state: { result, originalText: text, practice } });
              } catch (e) {
                console.error(e);
                toast.error("Failed to evaluate. Please check API key.");
              } finally {
                setIsEvaluating(false);
              }
            }}
            disabled={wordCount < 10 || isEvaluating}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-md transition-all",
              wordCount >= 10 && !isEvaluating
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105" 
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            )}
          >
            {isEvaluating ? (
              <><div className="w-4 h-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin"></div> Evaluating...</>
            ) : (
              <>Submit <Send className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>

      </div>
    </div>
  );
};

export default WritingEditor;
