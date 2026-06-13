import { Route } from 'react-router-dom';
import ToeicWritingP3Overview from './pages/ToeicWritingP3Overview';
import ToeicWritingP3Session from './pages/ToeicWritingP3Session';
import ToeicWritingP3Result from './pages/ToeicWritingP3Result';

/**
 * Route elements for the TOEIC Writing Part 3 (Opinion Essay) module.
 * Rendered inside the app's top-level <Routes> in App.tsx. Grading is shown on
 * a TOEIC-owned result page, kept separate from the IELTS-shared feedback page.
 */
export function toeicWritingRoutes() {
  return (
    <>
      <Route path="/writing/toeic-p3" element={<ToeicWritingP3Overview />} />
      <Route path="/writing/toeic-p3/session" element={<ToeicWritingP3Session />} />
      <Route path="/writing/toeic-p3/result" element={<ToeicWritingP3Result />} />
    </>
  );
}
