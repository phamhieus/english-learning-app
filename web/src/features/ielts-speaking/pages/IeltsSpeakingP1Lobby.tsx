import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserRound,
  Shuffle,
  BookOpen,
  Zap,
  Play,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { cn } from '../../../components/classNames';
import { IELTS_P1_TOPICS, getRandomTopics } from '../data/ieltsP1Topics';
import type { IeltsSpeakingMode, IeltsSpeakingTopic } from '../types/ielts-speaking.types';

interface ModeConfig {
  key: IeltsSpeakingMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  questionsHint: string;
  isMock: boolean;
}

const MODES: ModeConfig[] = [
  {
    key: 'full_mock_test',
    label: 'Full Mock Test',
    description: 'Simulates Part 1 with 2 topics and ~8 questions in 4–5 minutes. No hints shown.',
    icon: <ClipboardList className="w-5 h-5" />,
    questionsHint: '2 topics · 8 questions · ~4–5 min',
    isMock: true,
  },
  {
    key: 'practice_by_topic',
    label: 'Practice by Topic',
    description: 'Choose one topic and answer 4 questions at your own pace.',
    icon: <BookOpen className="w-5 h-5" />,
    questionsHint: '1 topic · 4 questions',
    isMock: false,
  },
  {
    key: 'quick_practice',
    label: 'Quick Practice',
    description: 'Answer 3 questions from a random topic. Good for a warm-up.',
    icon: <Zap className="w-5 h-5" />,
    questionsHint: '1 topic · 3 questions',
    isMock: false,
  },
  {
    key: 'random',
    label: 'Random Questions',
    description: 'Mix of 8 questions from different topics to train your reflexes.',
    icon: <Shuffle className="w-5 h-5" />,
    questionsHint: '8 random questions',
    isMock: false,
  },
];

const IeltsSpeakingP1Lobby = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preselected = (location.state as { selectedTopic?: string } | null)?.selectedTopic;
  const preselectedTopic = preselected
    ? IELTS_P1_TOPICS.find((t) => t.name.toLowerCase() === preselected.toLowerCase())
    : undefined;
  const hasPreselectedTopic = Boolean(preselectedTopic);

  const [activeMode, setActiveMode] = useState<IeltsSpeakingMode>(
    hasPreselectedTopic ? 'practice_by_topic' : 'full_mock_test',
  );
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(() => {
    return preselectedTopic ? [preselectedTopic.id] : [];
  });

  const needsTopicPicker = activeMode === 'practice_by_topic' && !hasPreselectedTopic;

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const canStart = useMemo(() => {
    if (activeMode === 'practice_by_topic') return selectedTopicIds.length >= 1;
    return true;
  }, [activeMode, selectedTopicIds]);

  const handleStart = () => {
    let topics: IeltsSpeakingTopic[];
    let questionCount: number;
    let isMockMode: boolean;

    switch (activeMode) {
      case 'full_mock_test': {
        topics = getRandomTopics(2);
        questionCount = 4;
        isMockMode = true;
        break;
      }
      case 'practice_by_topic': {
        const picked = selectedTopicIds.length
          ? IELTS_P1_TOPICS.filter((t) => selectedTopicIds.includes(t.id))
          : [getRandomTopics(1)[0]];
        topics = picked;
        questionCount = 4;
        isMockMode = false;
        break;
      }
      case 'quick_practice': {
        topics = getRandomTopics(1);
        questionCount = 3;
        isMockMode = false;
        break;
      }
      case 'random': {
        topics = IELTS_P1_TOPICS.sort(() => Math.random() - 0.5).slice(0, 8);
        questionCount = 1;
        isMockMode = false;
        break;
      }
    }

    navigate('/speaking/ielts-p1/session', {
      state: { mode: activeMode, topics, questionCount, isMockMode },
    });
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => navigate('/speaking')}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm font-medium"
        >
          ← Back
        </button>
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <UserRound className="w-3.5 h-3.5" /> IELTS
          </span>
          <span className="text-slate-400 text-sm">Speaking</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">Part 1 · Introduction and Interview</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">IELTS Speaking Part 1</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Answer questions about familiar topics. Scored on Fluency, Vocabulary, Grammar &amp; Pronunciation.
        </p>
      </div>

      {/* Mode selector */}
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Select Mode</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {MODES.map((m) => {
          const active = activeMode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => {
                setActiveMode(m.key);
                if (preselectedTopic && m.key === 'practice_by_topic') {
                  setSelectedTopicIds([preselectedTopic.id]);
                }
              }}
              className={cn(
                'text-left p-4 rounded-2xl border transition-all',
                active
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 shadow-md shadow-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600',
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={cn(
                    'p-1.5 rounded-lg',
                    active
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
                  )}
                >
                  {m.icon}
                </span>
                <span className={cn('font-bold text-sm', active ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200')}>
                  {m.label}
                </span>
                {m.isMock && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                    Mock
                  </span>
                )}
              </div>
              <p className={cn('text-xs leading-relaxed mb-2', active ? 'text-indigo-600/80 dark:text-indigo-300/80' : 'text-slate-500 dark:text-slate-400')}>
                {m.description}
              </p>
              <span className={cn('text-[11px] font-semibold', active ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500')}>
                {m.questionsHint}
              </span>
            </button>
          );
        })}
      </div>

      {preselectedTopic && activeMode === 'practice_by_topic' && (
        <div className="mb-8 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40">
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Selected Topic</p>
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">{preselectedTopic.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            This topic was selected from the speaking list.
          </p>
        </div>
      )}

      {/* Topic picker (only for practice_by_topic) */}
      {needsTopicPicker && (
        <div className="mb-8">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Choose Topic{' '}
            <span className="normal-case text-slate-400 font-normal ml-1">
              — {selectedTopicIds.length} selected
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {IELTS_P1_TOPICS.map((t) => {
              const on = selectedTopicIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTopic(t.id)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all',
                    on
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow shadow-indigo-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300',
                  )}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mock test info box */}
      {activeMode === 'full_mock_test' && (
        <div className="mb-8 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-semibold mb-1">Mock test rules</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-700 dark:text-amber-400">
            <li>Questions are not shown in advance</li>
            <li>No hints or reference answers during the test</li>
            <li>All answers are evaluated after the session ends</li>
          </ul>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!canStart}
        className={cn(
          'w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all shadow-lg',
          canStart
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30 hover:scale-[1.02]'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed',
        )}
      >
        <Play className="w-5 h-5 fill-current" />
        {activeMode === 'full_mock_test' ? 'Start Mock Test' : 'Start Practice'}
      </button>

      {!canStart && needsTopicPicker && (
        <p className="text-center text-xs text-slate-400 mt-2">Select at least one topic to continue</p>
      )}
    </div>
  );
};

export default IeltsSpeakingP1Lobby;
