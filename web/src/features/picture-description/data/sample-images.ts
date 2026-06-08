import type { PictureDescriptionPractice } from '../types/picture-description.types';

export const PICTURE_CATEGORIES = ['Daily Life', 'Workplace', 'Public Places', 'Nature & Travel'] as const;
export const PICTURE_LEVELS = ['Easy', 'Medium', 'Hard'] as const;

export const samplePictures: PictureDescriptionPractice[] = [
  {
    id: 1001,
    title: 'People having a meeting in an office',
    imageUrl: 'https://images.unsplash.com/photo-1690378820474-b468b8ee64d3?w=800&h=500&fit=crop',
    level: 'Easy',
    duration: '2 min',
    category: 'Workplace',
  },
  {
    id: 1002,
    title: 'A busy street market with vendors',
    imageUrl: 'https://images.unsplash.com/photo-1749197894518-623876b9181f?w=800&h=500&fit=crop',
    level: 'Medium',
    duration: '3 min',
    category: 'Public Places',
  },
  {
    id: 1003,
    title: 'Family cooking together in a kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=500&fit=crop',
    level: 'Easy',
    duration: '2 min',
    category: 'Daily Life',
  },
  {
    id: 1004,
    title: 'Workers loading boxes onto a truck',
    imageUrl: 'https://images.unsplash.com/photo-1774977867718-e926bedc8740?w=800&h=500&fit=crop',
    level: 'Medium',
    duration: '3 min',
    category: 'Workplace',
  },
  {
    id: 1005,
    title: 'A scenic mountain lake at sunrise',
    imageUrl: 'https://images.unsplash.com/photo-1603979649806-5299879db16b?w=800&h=500&fit=crop',
    level: 'Easy',
    duration: '2 min',
    category: 'Nature & Travel',
  },
  {
    id: 1006,
    title: 'Passengers waiting at a train station',
    imageUrl: 'https://images.unsplash.com/photo-1733315384471-0b84f65775c2?w=800&h=500&fit=crop',
    level: 'Medium',
    duration: '3 min',
    category: 'Public Places',
  },
  {
    id: 1007,
    title: 'A woman presenting a graph in a boardroom',
    imageUrl: 'https://images.unsplash.com/photo-1758691736545-5c33b6255dca?w=800&h=500&fit=crop',
    level: 'Hard',
    duration: '4 min',
    category: 'Workplace',
  },
  {
    id: 1008,
    title: 'Children playing in a park',
    imageUrl: 'https://images.unsplash.com/photo-1615489548573-8165c2c35e1b?w=800&h=500&fit=crop',
    level: 'Easy',
    duration: '2 min',
    category: 'Daily Life',
  },
  {
    id: 1009,
    title: 'A chef preparing food in a restaurant',
    imageUrl: 'https://images.unsplash.com/photo-1668270973870-bb22ba5d1381?w=800&h=500&fit=crop',
    level: 'Medium',
    duration: '3 min',
    category: 'Workplace',
  },
  {
    id: 1010,
    title: 'A crowded airport terminal',
    imageUrl: 'https://images.unsplash.com/photo-1674725690428-948af1d7f5a1?w=800&h=500&fit=crop',
    level: 'Hard',
    duration: '4 min',
    category: 'Public Places',
  },
  {
    id: 1011,
    title: 'A couple shopping at a supermarket',
    imageUrl: 'https://images.unsplash.com/photo-1675179181865-0f1b17e070d6?w=800&h=500&fit=crop',
    level: 'Easy',
    duration: '2 min',
    category: 'Daily Life',
  },
  {
    id: 1012,
    title: 'A tropical beach with palm trees',
    imageUrl: 'https://images.unsplash.com/photo-1672841828459-bc913fdcd995?w=800&h=500&fit=crop',
    level: 'Medium',
    duration: '3 min',
    category: 'Nature & Travel',
  },
];

export function getFilteredPictures(
  category: string,
  level: string
): PictureDescriptionPractice[] {
  return samplePictures.filter((p) => {
    const catMatch = category === 'All' || p.category === category;
    const lvlMatch = level === 'All' || p.level === level;
    return catMatch && lvlMatch;
  });
}
