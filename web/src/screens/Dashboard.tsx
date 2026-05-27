import React from 'react';
import { ArrowRight, Play, BookOpen, MessageCircle, BarChart3, TrendingUp, Mic2, Edit3, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../components/classNames';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Hero Section */}
      <section className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 p-8 text-white shadow-xl shadow-indigo-500/20">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Ready to improve your English today?</h1>
          <p className="text-indigo-100 text-lg mb-8 opacity-90">Your AI Coach is ready. Continue your practice or try a new module.</p>
          
          <button 
            onClick={() => navigate('/speaking')}
            className="group flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
          >
            Continue Practice
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute right-20 bottom-0 w-64 h-64 bg-purple-500/20 blur-2xl rounded-full translate-y-1/2"></div>
      </section>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 mb-10">
        {[
          { icon: TrendingUp, color: "orange", label: "Streak", labelFull: "Daily Streak", value: "12 Days" },
          { icon: BarChart3, color: "green", label: "Pronunciation", labelFull: "Avg Pronunciation", value: "85%" },
          { icon: BookOpen, color: "blue", label: "Words", labelFull: "Words Learned", value: "2,405" },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-2xl p-3 md:p-6 flex flex-col md:flex-row items-center gap-2 md:gap-4 group hover:-translate-y-1 transition-transform">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-${s.color}-100 dark:bg-${s.color}-900/30 text-${s.color}-500 flex items-center justify-center shrink-0`}>
              <s.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium hidden md:block">{s.labelFull}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium md:hidden">{s.label}</p>
              <p className="text-lg md:text-2xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <h2 className="text-2xl font-bold mb-6">Quick Access</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-10">
        {[
          { title: "Shadowing", icon: Play, color: "bg-indigo-500", path: "/speaking" },
          { title: "Mock Dialogue", icon: MessageCircle, color: "bg-purple-500", path: "/speaking/mock-dialogue" },
          { title: "IELTS Speaking", icon: Mic2, color: "bg-cyan-500", path: "/speaking" },
          { title: "Writing Email", icon: Edit3, color: "bg-orange-500", path: "/writing" },
          { title: "Listening", icon: Headphones, color: "bg-blue-500", path: "/listening" },
          { title: "Reading", icon: BookOpen, color: "bg-emerald-500", path: "/reading" }
        ].map((item, i) => (
          <button 
            key={i}
            onClick={() => navigate(item.path)}
            className={cn(
              "rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center text-center gap-3 md:gap-4 hover:-translate-y-1 transition-all group",
              "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
              (item.title === "Listening" || item.title === "Reading" || item.title === "Writing Email") 
                ? "shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.2)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-indigo-100 dark:border-indigo-900/50" 
                : "shadow-sm hover:shadow-md"
            )}
          >
            <div className={cn("w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg", item.color, "group-hover:scale-110 transition-transform")}>
              <item.icon className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <span className="font-semibold text-sm md:text-base text-slate-800 dark:text-slate-200">{item.title}</span>
          </button>
        ))}
      </div>

    </div>
  );
};

export default Dashboard;
