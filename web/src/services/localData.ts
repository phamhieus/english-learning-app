import type { Practice } from './storage';
import topicsData from '../assets/topics.json';

const mapLevel = (levelStr: string) => {
  if (levelStr.includes('Beginner')) return 'Easy';
  if (levelStr.includes('Intermediate') && !levelStr.includes('Beginner')) return 'Medium';
  if (levelStr.includes('Advanced')) return 'Hard';
  return 'Medium';
};

export const generateLocalPractices = (domain: 'speaking' | 'writing', filter: string): Practice[] => {
  // Find matching topics from JSON
  const allTopics: Practice[] = [];
  
  topicsData.topicBank.forEach(bank => {
    if (bank.skill.toLowerCase() === domain) {
      bank.topics.forEach(t => {
        const anyT = t as any;
        const img = anyT.imageUrl || anyT.thumbnailUrl || (anyT.photo && anyT.photo.imageUrl);

        // Advanced filter mapping logic
        const fLower = filter.toLowerCase();
        let match = false;
        if (fLower === 'all' || fLower === 'general practice') {
          match = true;
        } else if (fLower.includes('picture')) {
          match = anyT.taskType?.toLowerCase().includes('picture') || anyT.section?.toLowerCase().includes('picture');
          // If we explicitly request a picture task, make sure it has an image in JSON
          if (match && !img) match = false;
        } else if (fLower.includes('email') || fLower.includes('request')) {
          match = anyT.taskType?.toLowerCase().includes('email') || anyT.taskType?.toLowerCase().includes('written request');
        } else if (fLower.includes('essay')) {
          match = anyT.taskType?.toLowerCase().includes('essay');
        } else {
          // generic fallback
          match = anyT.taskType?.toLowerCase().includes(fLower) || anyT.section?.toLowerCase().includes(fLower) || anyT.topicGroup?.toLowerCase().includes(fLower);
        }

        if (match) {
          const practice: Practice = {
            id: Date.now() + Math.floor(Math.random() * 10000),
            title: t.topicName,
            type: t.taskType,
            level: mapLevel(t.level),
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
