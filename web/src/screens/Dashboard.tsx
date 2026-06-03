import { ArrowRight, MessageCircle, Mic2, Edit3, Repeat2, Flame, Gauge, LineChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../components/classNames';
import { useUserStats } from '../services/useUserStats';
import { useSettings } from '../components/useSettings';

const Dashboard = () => {
  const navigate = useNavigate();
  const stats = useUserStats();
  const { primaryExam } = useSettings();

  const streakLabel = `${stats.streak} Day${stats.streak !== 1 ? 's' : ''}`;
  const toeicLabel  = stats.toeicEst !== null ? String(stats.toeicEst) : '0';
  const ieltsLabel  = stats.ieltsEst !== null ? String(stats.ieltsEst) : '0';
  const isToeic = primaryExam === 'TOEIC';

  return (
    <div className="animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="mb-6 sm:mb-9 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/20">
        <div className="relative z-10 max-w-xl">
          <p className="text-indigo-100 font-semibold tracking-widest uppercase text-[11px] sm:text-xs mb-2 sm:mb-3">TOEIC · IELTS Prep</p>
          <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 tracking-tight">Let's get you exam-ready.</h1>
          <p className="text-indigo-100 text-sm sm:text-lg mb-6 sm:mb-8 opacity-90">
            {stats.totalSessions > 0
              ? `${stats.totalSessions} session${stats.totalSessions !== 1 ? 's' : ''} completed. Keep the momentum going!`
              : 'Pick a task and start your first practice session. Your AI Coach scores every answer like a real examiner.'}
          </p>
          <button
            onClick={() => navigate('/speaking')}
            className="group flex items-center gap-2 bg-white text-indigo-600 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
          >
            {stats.totalSessions > 0 ? 'Continue Practice' : 'Start Practising'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute right-20 bottom-0 w-64 h-64 bg-purple-500/20 blur-2xl rounded-full translate-y-1/2" />
      </section>

      {/* Stats — compact stacked cards on phone, horizontal on desktop */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-10">
        {[
          { color: 'orange', icon: Flame,     label: 'Daily Streak', value: streakLabel },
          { color: 'blue',   icon: Gauge,     label: 'TOEIC (est.)', value: toeicLabel  },
          { color: 'cyan',   icon: LineChart, label: 'IELTS (est.)', value: ieltsLabel  },
        ].map((s, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-3 sm:p-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4 hover:-translate-y-1 transition-transform"
          >
            <div className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0',
              s.color === 'orange' ? 'bg-orange-100 text-orange-500 dark:bg-orange-900/30' :
              s.color === 'blue'   ? 'bg-blue-100 text-blue-500 dark:bg-blue-900/30' :
                                     'bg-cyan-100 text-cyan-500 dark:bg-cyan-900/30'
            )}>
              <s.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-tight">{s.label}</p>
              <p className="text-lg sm:text-2xl font-bold leading-tight mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Quick Access</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-10">
        {[
          {
            title: `${primaryExam} Speaking`,
            sub: isToeic ? '11 question types' : 'Parts 1 · 2 · 3',
            icon: Mic2,
            color: isToeic ? 'bg-blue-500' : 'bg-cyan-500',
            path: '/speaking',
          },
          {
            title: `${primaryExam} Writing`,
            sub: isToeic ? 'Picture · Email · Essay' : 'Task 1 · Task 2',
            icon: Edit3,
            color: isToeic ? 'bg-indigo-500' : 'bg-orange-500',
            path: '/writing',
          },
          { title: 'Shadowing',      sub: 'Listen · repeat · video',    icon: Repeat2,       color: 'bg-purple-500',  path: '/shadowing', highlight: true },
          { title: 'Mock Interview', sub: 'Full speaking test',         icon: MessageCircle, color: 'bg-emerald-500', path: '/shadowing/mock-dialogue' },
        ].map((it, i) => (
          <button
            key={i}
            onClick={() => navigate(it.path)}
            className={cn(
              'rounded-2xl p-4 sm:p-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4 text-left transition-all hover:-translate-y-1',
              'bg-white dark:bg-slate-800 border',
              it.highlight
                ? 'border-indigo-100 dark:border-indigo-900/50 shadow-[0_8px_30px_rgb(0,0,0,0.10)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
                : 'border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
            )}
          >
            <div className={cn('w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0', it.color)}>
              <it.icon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm sm:text-base leading-tight">{it.title}</span>
              <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium">{it.sub}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
