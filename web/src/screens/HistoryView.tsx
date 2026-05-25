import React, { useState } from 'react';
import { Calendar, ChevronRight, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

import { getHistory } from '../services/storage';
import type { HistoryItem } from '../services/storage';

const HistoryView = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  React.useEffect(() => {
    const hist = getHistory();
    setHistory(hist);
    
    const chartData = [...hist].reverse().map((item) => ({
      name: item.date.split(',')[0],
      score: item.score
    }));
    setData(chartData);
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Practice History</h1>
        <p className="text-slate-500 dark:text-slate-400">Track your progress over time.</p>
      </div>

      {/* Chart Section */}
      <div className="glass-card rounded-3xl p-8 mb-10 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-500" /> Weekly Progress</h2>
          <span className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Last 7 Days</span>
        </div>
        
        <div className="h-64 w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-slate-400">
               <span className="text-3xl mb-2 block">📊</span>
               <p>No data available to chart.</p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <h2 className="text-xl font-bold mb-6">Recent Sessions</h2>
      
      {history.length > 0 ? (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
          {history.map((item) => (
            <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--background)] bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Calendar className="w-4 h-4" />
              </div>

              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-card p-6 rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all cursor-default group-hover:border-indigo-200 dark:group-hover:border-indigo-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400">{item.date}</span>
                  <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{item.type}</span>
                </div>
                <h3 className="font-bold text-lg mb-4">{item.title}</h3>
                <div className="flex justify-between items-center mt-auto">
                  <div className="flex flex-col">
                     <span className="text-xs text-slate-400 font-semibold uppercase">Score</span>
                     <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xl">{item.score}</span>
                  </div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{item.focus}</span>
                </div>
              </div>
              
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No past sessions found</h3>
          <p className="text-slate-500 dark:text-slate-400">Complete some practice sessions to see your history here.</p>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
