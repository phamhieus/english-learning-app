import type { ShadowingLesson } from '../types/shadowing.types';

export const mockShadowingLesson: ShadowingLesson = {
  id: 'lesson_health_001',
  title: 'The Benefits of Daily Exercise',
  description:
    'Practice speaking about health and fitness topics using natural, connected English at a natural pace.',
  level: 'intermediate',
  topic: 'health & lifestyle',
  totalSegments: 6,
  durationMinutes: 15,
  segments: [
    {
      id: 'seg_001',
      lessonId: 'lesson_health_001',
      type: 'sentence',
      order: 1,
      text: 'Regular physical activity has numerous benefits for both the body and the mind.',
      status: 'not_started',
      attempts: [],
    },
    {
      id: 'seg_002',
      lessonId: 'lesson_health_001',
      type: 'sentence',
      order: 2,
      text: 'Exercise helps to maintain a healthy weight and reduces the risk of chronic diseases.',
      status: 'not_started',
      attempts: [],
    },
    {
      id: 'seg_003',
      lessonId: 'lesson_health_001',
      type: 'sentence',
      order: 3,
      text: 'In addition, staying active significantly improves mood and reduces stress levels.',
      status: 'not_started',
      attempts: [],
    },
    {
      id: 'seg_004',
      lessonId: 'lesson_health_001',
      type: 'sentence',
      order: 4,
      text: 'Studies have shown that people who exercise regularly tend to sleep much better at night.',
      status: 'not_started',
      attempts: [],
    },
    {
      id: 'seg_005',
      lessonId: 'lesson_health_001',
      type: 'sentence',
      order: 5,
      text: 'Even a thirty-minute walk three times a week can make a significant difference to your health.',
      status: 'not_started',
      attempts: [],
    },
    {
      id: 'seg_006',
      lessonId: 'lesson_health_001',
      type: 'paragraph',
      order: 6,
      paragraphIndex: 1,
      text: 'The key is to find an activity that you genuinely enjoy, whether it is swimming, cycling, dancing, or simply walking in the park. When exercise becomes a regular part of your daily routine, you will notice improvements in your energy levels, concentration, and overall sense of wellbeing.',
      status: 'not_started',
      attempts: [],
    },
  ],
};

export const mockShadowingLessons: ShadowingLesson[] = [mockShadowingLesson];
