export interface Practice {
  id: number;
  title: string;
  shortTitle?: string;
  duration: string;
  level: string;
  type: string;
  focus?: string;
  image?: string;
}

export interface HistoryItem {
  id: number;
  date: string;
  title: string;
  type: string;
  score: number;
  focus: string;
}

export const getPractices = (category: string): Practice[] => {
  const data = localStorage.getItem(`practices_${category}`);
  return data ? JSON.parse(data) : [];
};

export const savePractices = (category: string, practices: Practice[]) => {
  localStorage.setItem(`practices_${category}`, JSON.stringify(practices));
};

export const getHistory = (): HistoryItem[] => {
  const data = localStorage.getItem('user_history');
  return data ? JSON.parse(data) : [];
};

export const addHistory = (item: Omit<HistoryItem, 'id' | 'date'>) => {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: Date.now(),
    date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date())
  };
  history.unshift(newItem);
  localStorage.setItem('user_history', JSON.stringify(history));
};

// ── IELTS Speaking Part 1 sessions ───────────────────────────────────────────

import type { IeltsP1SessionResult } from './ai';

const IELTS_P1_KEY = 'ielts_p1_sessions';
const IELTS_P1_MAX = 20;

export interface IeltsP1SessionRecord {
  id: number;
  date: string;
  result: IeltsP1SessionResult;
}

export const getIeltsP1Sessions = (): IeltsP1SessionRecord[] => {
  try {
    const raw = localStorage.getItem(IELTS_P1_KEY);
    return raw ? (JSON.parse(raw) as IeltsP1SessionRecord[]) : [];
  } catch {
    return [];
  }
};

export const saveIeltsP1Session = (result: IeltsP1SessionResult): IeltsP1SessionRecord => {
  const sessions = getIeltsP1Sessions();
  const record: IeltsP1SessionRecord = {
    id: Date.now(),
    date: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date()),
    result,
  };
  sessions.unshift(record);
  localStorage.setItem(IELTS_P1_KEY, JSON.stringify(sessions.slice(0, IELTS_P1_MAX)));
  return record;
};
