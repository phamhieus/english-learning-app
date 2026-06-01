import type { Practice } from './storage';
import topicsData from '../assets/topics.json';

const mapLevel = (levelStr: string) => {
  if (levelStr.includes('Beginner')) return 'Easy';
  if (levelStr.includes('Intermediate') && !levelStr.includes('Beginner')) return 'Medium';
  if (levelStr.includes('Advanced')) return 'Hard';
  return 'Medium';
};

interface TopicData {
  topicName: string;
  taskType: string;
  level: string;
  section?: string;
  topicGroup?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  photo?: {
    imageUrl?: string;
  };
}

const matchesFilter = (topic: TopicData, filter: string, hasImage: boolean) => {
  const fLower = filter.toLowerCase();
  const taskType = topic.taskType?.toLowerCase() ?? '';
  const section = topic.section?.toLowerCase() ?? '';
  const topicGroup = topic.topicGroup?.toLowerCase() ?? '';

  if (fLower === 'all' || fLower === 'general practice') return true;
  if (fLower.includes('picture')) return hasImage && (taskType.includes('picture') || section.includes('picture'));
  if (fLower.includes('email') || fLower.includes('request')) return taskType.includes('email') || taskType.includes('written request');
  if (fLower.includes('essay')) return taskType.includes('essay');

  return taskType.includes(fLower) || section.includes(fLower) || topicGroup.includes(fLower);
};

export const generateLocalPractices = (domain: 'speaking' | 'writing', filter: string): Practice[] => {
  // Find matching topics from JSON
  const allTopics: Practice[] = [];
  
  topicsData.topicBank.forEach(bank => {
    if (bank.skill.toLowerCase() === domain) {
      bank.topics.forEach(t => {
        const topic = t as TopicData;
        const img = topic.imageUrl || topic.thumbnailUrl || topic.photo?.imageUrl;
        const match = matchesFilter(topic, filter, Boolean(img));

        if (match) {
          const practice: Practice = {
            id: Date.now() + Math.floor(Math.random() * 10000),
            title: topic.topicName,
            type: topic.taskType,
            level: mapLevel(topic.level),
            duration: '5 mins'
          };
          
          if (img) {
            practice.image = img;
          }
          
          allTopics.push(practice);
        }
      });
    }
  });
  
  // Shuffle array
  const shuffled = allTopics.sort(() => 0.5 - Math.random());
  
  // Return 6 random topics
  return shuffled.slice(0, 6);
};

export const getExamTopics = (
  exam: 'TOEIC' | 'IELTS',
  skill: 'Speaking' | 'Writing',
  section: string
): Practice[] => {
  const practices: Practice[] = [];

  topicsData.topicBank.forEach(bank => {
    if (
      bank.exam === exam &&
      bank.skill === skill &&
      bank.section === section
    ) {
      bank.topics.forEach(t => {
        const topic = t as TopicData;
        const img = topic.imageUrl || topic.thumbnailUrl || topic.photo?.imageUrl;
        const practice: Practice = {
          id: Date.now() + Math.floor(Math.random() * 100000),
          title: topic.topicName,
          type: topic.taskType,
          level: mapLevel(topic.level),
          duration: '5 mins',
        };
        if (img) {
          practice.image = img;
        }
        practices.push(practice);
      });
    }
  });

  return practices;
};
