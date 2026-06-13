/**
 * Demo page for previewing the FeedbackResultPage with mock data.
 * Accessible at /#/feedback/demo
 * Remove this file when live AI integration is complete.
 */
import { useState } from 'react';
import {
  mockIeltsWritingTask1,
  mockIeltsWritingTask2,
  mockToeicWritingEssay,
  mockIeltsSpeakingP2,
  mockToeicSpeakingPicture,
  mockShadowing,
  mockVirtualConversation,
} from './mock';
import type { FeedbackResult } from './types/feedback.types';
import { FeedbackResultPage } from './FeedbackResultPage';

type DemoKey = 'ielts-t1' | 'ielts-t2' | 'toeic-essay' | 'ielts-sp' | 'toeic-pic' | 'shadow' | 'conv';

const DEMOS: Record<DemoKey, { label: string; data: FeedbackResult }> = {
  'ielts-t1': { label: 'IELTS Writing Task 1 · Map', data: mockIeltsWritingTask1 },
  'ielts-t2': { label: 'IELTS Writing Task 2 · Opinion Essay', data: mockIeltsWritingTask2 },
  'toeic-essay': { label: 'TOEIC Writing · Opinion Essay', data: mockToeicWritingEssay },
  'ielts-sp': { label: 'IELTS Speaking Part 2', data: mockIeltsSpeakingP2 },
  'toeic-pic': { label: 'TOEIC Speaking · Picture', data: mockToeicSpeakingPicture },
  shadow: { label: 'Shadowing', data: mockShadowing },
  conv: { label: 'Virtual Conversation', data: mockVirtualConversation },
};

export function FeedbackDemo() {
  const [active, setActive] = useState<DemoKey>('ielts-t1');

  return (
    <div className="animate-in fade-in duration-300">
      {/* Picker */}
      <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl">
        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-3 uppercase tracking-wide">
          Demo — mock data, no API required
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DEMOS) as DemoKey[]).map(key => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                active === key
                  ? 'bg-amber-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/20'
              }`}
            >
              {DEMOS[key].label}
            </button>
          ))}
        </div>
      </div>

      <FeedbackResultPage result={DEMOS[active].data} />
    </div>
  );
}
