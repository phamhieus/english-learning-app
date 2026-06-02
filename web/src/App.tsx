import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import { SettingsProvider } from './components/SettingsContext';
import { ToastProvider } from './components/ToastContext';
import { Layout } from './components/Layout';
import { SplashScreen } from './components/SplashScreen';

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
import LearningProgressPage from './features/learning-progress/pages/LearningProgressPage';
import SettingsView from './screens/SettingsView';
import ShadowingList from './screens/ShadowingList';
import ShadowingPracticePage from './features/shadowing/components/ShadowingPracticePage';
import VirtualConversation from './screens/VirtualConversation';
import PictureDescriptionList from './screens/PictureDescriptionList';
import PictureDescriptionPractice from './screens/PictureDescriptionPractice';
import PictureDescriptionResult from './screens/PictureDescriptionResult';
import { videoShadowingRoutes } from './features/video-shadowing/routes';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <ThemeProvider>
        <SettingsProvider>
          <ToastProvider>
            <HashRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/speaking" element={<SpeakingList />} />
                  <Route path="/speaking/record" element={<SpeakingRecording />} />
                  <Route path="/shadowing/mock-dialogue" element={<MockDialogue />} />
                  <Route path="/speaking/result" element={<SpeakingResult />} />

                  <Route path="/writing" element={<WritingList />} />
                  <Route path="/writing/editor" element={<WritingEditor />} />
                  <Route path="/writing/result" element={<WritingResult />} />
                  <Route path="/shadowing/virtual-conversation" element={<VirtualConversation />} />

                  <Route path="/shadowing" element={<ShadowingList />} />
                  <Route path="/shadowing/practice" element={<ShadowingPracticePage />} />
                  <Route path="/speaking/picture" element={<PictureDescriptionList />} />
                  <Route path="/speaking/picture/practice" element={<PictureDescriptionPractice />} />
                  <Route path="/speaking/picture/result" element={<PictureDescriptionResult />} />
                  <Route path="/picture-description" element={<PictureDescriptionList />} />
                  <Route path="/picture-description/practice" element={<PictureDescriptionPractice />} />
                  <Route path="/picture-description/result" element={<PictureDescriptionResult />} />


                  {videoShadowingRoutes()}

                  <Route path="/progress" element={<LearningProgressPage />} />
                  <Route path="/history" element={<HistoryView />} />
                  <Route path="/settings" element={<SettingsView />} />
                </Routes>
              </Layout>
            </HashRouter>
          </ToastProvider>
        </SettingsProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
