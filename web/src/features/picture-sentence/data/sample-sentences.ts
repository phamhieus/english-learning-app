import type { SentenceWritingPractice } from '../types/picture-sentence.types';

export const SENTENCE_CATEGORIES = ['Daily Life', 'Workplace', 'Public Places', 'Nature & Travel'] as const;
export const SENTENCE_LEVELS = ['Easy', 'Medium', 'Hard'] as const;

/**
 * Curated TOEIC Writing Q1-5 prompts. Each item pairs a workplace/everyday
 * photo with two words/phrases the learner must use in one sentence — the exact
 * format of the real test. Images are bundled locally in public/images/practice
 * (same set as the Speaking "Describe a Picture" module) so both flows load
 * instantly and offline.
 */
export const sampleSentences: SentenceWritingPractice[] = [
  {
    id: 2001,
    title: 'People having a meeting in an office',
    imageUrl: '/images/practice/photo-1690378820474-b468b8ee64d3.jpg',
    level: 'Easy',
    category: 'Workplace',
    words: ['meeting', 'discuss'],
    duration: '~1.5 min',
  },
  {
    id: 2002,
    title: 'A busy street market with vendors',
    imageUrl: '/images/practice/photo-1749197894518-623876b9181f.jpg',
    level: 'Medium',
    category: 'Public Places',
    words: ['market', 'because'],
    duration: '~1.5 min',
  },
  {
    id: 2003,
    title: 'Family cooking together in a kitchen',
    imageUrl: '/images/practice/photo-1556910103-1c02745aae4d.jpg',
    level: 'Easy',
    category: 'Daily Life',
    words: ['prepare', 'together'],
    duration: '~1.5 min',
  },
  {
    id: 2004,
    title: 'Workers loading boxes onto a truck',
    imageUrl: '/images/practice/photo-1774977867718-e926bedc8740.jpg',
    level: 'Medium',
    category: 'Workplace',
    words: ['boxes', 'onto'],
    duration: '~1.5 min',
  },
  {
    id: 2005,
    title: 'A scenic mountain lake at sunrise',
    imageUrl: '/images/practice/photo-1603979649806-5299879db16b.jpg',
    level: 'Medium',
    category: 'Nature & Travel',
    words: ['lake', 'surround'],
    duration: '~1.5 min',
  },
  {
    id: 2006,
    title: 'Passengers waiting at a train station',
    imageUrl: '/images/practice/photo-1733315384471-0b84f65775c2.jpg',
    level: 'Medium',
    category: 'Public Places',
    words: ['wait for', 'platform'],
    duration: '~1.5 min',
  },
  {
    id: 2007,
    title: 'A woman presenting a graph in a boardroom',
    imageUrl: '/images/practice/photo-1758691736545-5c33b6255dca.jpg',
    level: 'Hard',
    category: 'Workplace',
    words: ['present', 'during'],
    duration: '~1.5 min',
  },
  {
    id: 2008,
    title: 'Children playing in a park',
    imageUrl: '/images/practice/photo-1615489548573-8165c2c35e1b.jpg',
    level: 'Easy',
    category: 'Daily Life',
    words: ['children', 'while'],
    duration: '~1.5 min',
  },
  {
    id: 2009,
    title: 'A chef preparing food in a restaurant',
    imageUrl: '/images/practice/photo-1668270973870-bb22ba5d1381.jpg',
    level: 'Medium',
    category: 'Workplace',
    words: ['chef', 'cook'],
    duration: '~1.5 min',
  },
  {
    id: 2010,
    title: 'A crowded airport terminal',
    imageUrl: '/images/practice/photo-1674725690428-948af1d7f5a1.jpg',
    level: 'Hard',
    category: 'Public Places',
    words: ['luggage', 'carry'],
    duration: '~1.5 min',
  },
  {
    id: 2011,
    title: 'A couple shopping at a supermarket',
    imageUrl: '/images/practice/photo-1675179181865-0f1b17e070d6.jpg',
    level: 'Easy',
    category: 'Daily Life',
    words: ['cart', 'push'],
    duration: '~1.5 min',
  },
  {
    id: 2012,
    title: 'A tropical beach with palm trees',
    imageUrl: '/images/practice/photo-1672841828459-bc913fdcd995.jpg',
    level: 'Medium',
    category: 'Nature & Travel',
    words: ['palm trees', 'along'],
    duration: '~1.5 min',
  },
];

export function getFilteredSentences(
  category: string,
  level: string,
): SentenceWritingPractice[] {
  return sampleSentences.filter((p) => {
    const catMatch = category === 'All' || p.category === category;
    const lvlMatch = level === 'All' || p.level === level;
    return catMatch && lvlMatch;
  });
}
