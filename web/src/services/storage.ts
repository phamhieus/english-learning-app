export interface Practice {
  id: number;
  title: string;
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
