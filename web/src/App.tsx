import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import { SettingsProvider } from './components/SettingsContext';
import { ToastProvider } from './components/ToastContext';
import { Layout } from './components/Layout';

// Screens
import Dashboard from './screens/Dashboard';
import SpeakingList from './screens/SpeakingList';
import SpeakingRecording from './screens/SpeakingRecording';
import MockDialogue from './screens/MockDialogue';
import SpeakingResult from './screens/SpeakingResult';
import WritingList from './screens/WritingList';
import WritingEditor from './screens/WritingEditor';
import WritingResult from './screens/WritingResult';
import HistoryView from './screens/HistoryView';
import SettingsView from './screens/SettingsView';

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ToastProvider>
          <HashRouter>
            <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/speaking" element={<SpeakingList />} />
              <Route path="/speaking/record" element={<SpeakingRecording />} />
              <Route path="/speaking/mock-dialogue" element={<MockDialogue />} />
              <Route path="/speaking/result" element={<SpeakingResult />} />
              
              <Route path="/writing" element={<WritingList />} />
              <Route path="/writing/editor" element={<WritingEditor />} />
              <Route path="/writing/result" element={<WritingResult />} />
              
              <Route path="/history" element={<HistoryView />} />
              <Route path="/settings" element={<SettingsView />} />
            </Routes>
            </Layout>
          </HashRouter>
        </ToastProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
