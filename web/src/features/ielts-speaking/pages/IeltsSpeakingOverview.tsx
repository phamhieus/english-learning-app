import { BookOpen, ChevronRight, ClipboardList, MessageSquareText, Mic2, RotateCcw, Timer, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const cards = [
  {
    path: '/speaking/ielts-p1',
    label: 'IELTS Speaking Part 1 - Introduction and Interview',
    title: 'Introduction and Interview',
    text: 'Answer short questions about familiar topics.',
    duration: '4-5 minutes',
    icon: <UserRound className="w-5 h-5" />,
  },
  {
    path: '/speaking/ielts/part-2',
    label: 'IELTS Speaking Part 2 - Long Turn',
    title: 'Long Turn',
    text: 'Prepare for one minute and speak for up to two minutes from a cue card.',
    duration: '3-4 minutes',
    icon: <Mic2 className="w-5 h-5" />,
  },
  {
    path: '/speaking/ielts/part-3',
    label: 'IELTS Speaking Part 3 - Discussion',
    title: 'Discussion',
    text: 'Discuss broader and more abstract questions linked to a Part 2 topic.',
    duration: '4-5 minutes',
    icon: <MessageSquareText className="w-5 h-5" />,
  },
];

const IeltsSpeakingOverview = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      <button
        onClick={() => navigate('/')}
        className="text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white mb-5"
      >
        Back
      </button>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" /> IELTS Speaking
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 mb-3">
            IELTS Speaking
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Practice all three parts of the IELTS Speaking test with timed prompts, cue cards, discussion questions, transcripts, and practice-only feedback.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ['11-14', 'minutes'],
            ['3', 'parts'],
            ['4', 'criteria'],
          ].map(([value, label]) => (
            <div key={label} className="glass-card rounded-2xl p-4 text-center border border-transparent">
              <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className="group text-left glass-card rounded-2xl p-5 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/60 hover:-translate-y-1 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                {card.icon}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{card.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{card.text}</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Timer className="w-3.5 h-3.5" /> {card.duration}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <ClipboardList className="w-4 h-4" />, title: 'Recent Sessions', text: 'Review your latest speaking attempts.' },
          { icon: <Timer className="w-4 h-4" />, title: 'Progress Overview', text: 'Track estimated practice bands over time.' },
          { icon: <RotateCcw className="w-4 h-4" />, title: 'Review Mistakes', text: 'Revisit weaker answers after feedback.' },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 p-4">
            <div className="text-slate-400 mb-2">{item.icon}</div>
            <p className="font-bold text-slate-700 dark:text-slate-200">{item.title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IeltsSpeakingOverview;

