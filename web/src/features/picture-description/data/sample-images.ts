import type { PictureDescriptionPractice } from '../types/picture-description.types';

export const PICTURE_CATEGORIES = ['Daily Life', 'Workplace', 'Public Places', 'Nature & Travel'] as const;
export const PICTURE_LEVELS = ['Easy', 'Medium', 'Hard'] as const;

export const samplePictures: PictureDescriptionPractice[] = [
  {
    id: 1001,
    title: 'People having a meeting in an office',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=500&fit=crop',
    level: 'Easy',
    duration: '2 min',
    category: 'Workplace',
  },
  {
    id: 1002,
    title: 'A busy street market with vendors',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop',
    level: 'Medium',
    duration: '3 min',
    category: 'Public Places',
  },
  {
    id: 1003,
    title: 'Family cooking together in a kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=500&fit=crop',
    level: 'Easy',
    duration: '2 min',
    category: 'Daily Life',
  },
  {
    id: 1004,
    title: 'Workers loading boxes onto a truck',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=500&fit=crop',
    level: 'Medium',
    duration: '3 min',
    category: 'Workplace',
  },
  {
    id: 1005,
    title: 'A scenic mountain lake at sunrise',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
    level: 'Easy',
    duration: '2 min',
    category: 'Nature & Travel',
  },
  {
    id: 1006,
    title: 'Passengers waiting at a train station',
    imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&h=500&fit=crop',
    level: 'Medium',
    duration: '3 min',
    category: 'Public Places',
  },
  {
    id: 1007,
    title: 'A woman presenting a graph in a boardroom',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=500&fit=crop',
    level: 'Hard',
    duration: '4 min',
    category: 'Workplace',
  },
  {
    id: 1008,
    title: 'Children playing in a park',
    imageUrl: 'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=800&h=500&fit=crop',
    level: 'Easy',
    duration: '2 min',
    category: 'Daily Life',
  },
  {
    id: 1009,
    title: 'A chef preparing food in a restaurant',
    imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=500&fit=crop',
    level: 'Medium',
    duration: '3 min',
    category: 'Workplace',
  },
  {
    id: 1010,
    title: 'A crowded airport terminal',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=800&h=500&fit=crop',
    level: 'Hard',
    duration: '4 min',
    category: 'Public Places',
  },
  {
    id: 1011,
    title: 'A couple shopping at a supermarket',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=500&fit=crop',
    level: 'Easy',
    duration: '2 min',
    category: 'Daily Life',
  },
  {
    id: 1012,
    title: 'A tropical beach with palm trees',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop',
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
