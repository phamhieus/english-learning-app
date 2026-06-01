import { Route } from 'react-router-dom';
import VideoShadowingLibraryPage from './pages/VideoShadowingLibraryPage';
import AddVideoShadowingPage from './pages/AddVideoShadowingPage';
import ScriptProcessingPage from './pages/ScriptProcessingPage';
import ReviewSegmentsPage from './pages/ReviewSegmentsPage';
import VoaLessonDetailPage from './pages/VoaLessonDetailPage';
import VideoShadowingPracticePage from './pages/VideoShadowingPracticePage';
import VideoShadowingResultPage from './pages/VideoShadowingResultPage';

/**
 * Route elements for the Video Shadowing module. Rendered inside the app's
 * top-level <Routes> in App.tsx. Lesson-centric paths (matches the existing
 * HashRouter convention; spec routes adapted accordingly).
 */
export function videoShadowingRoutes() {
  return (
    <>
      <Route path="/video-shadowing" element={<VideoShadowingLibraryPage />} />
      <Route path="/video-shadowing/add" element={<AddVideoShadowingPage />} />
      <Route path="/video-shadowing/processing/:lessonId" element={<ScriptProcessingPage />} />
      <Route path="/video-shadowing/lessons/:lessonId" element={<VoaLessonDetailPage />} />
      <Route path="/video-shadowing/lessons/:lessonId/review" element={<ReviewSegmentsPage />} />
      <Route path="/video-shadowing/lessons/:lessonId/practice" element={<VideoShadowingPracticePage />} />
      <Route path="/video-shadowing/lessons/:lessonId/result" element={<VideoShadowingResultPage />} />
    </>
  );
}
