import { PART2_CUE_CARDS } from './part2CueCards';
import type { Part2CueCard, Part3DiscussionSet, Part3QuestionType } from '../types/ielts-speaking.types';

const TYPE_ROTATION: Part3QuestionType[] = [
  'opinion',
  'reason',
  'comparison',
  'change_over_time',
  'advantages_disadvantages',
  'prediction',
];

const THEME_LABELS: Record<Part2CueCard['category'], string> = {
  people: 'people and social influence',
  places: 'places and communities',
  objects: 'possessions and daily choices',
  experiences: 'personal experiences',
  events: 'events and celebrations',
  activities: 'activities and habits',
  education: 'education and learning',
  work: 'work and careers',
  technology: 'technology and modern life',
  travel: 'travel and mobility',
  culture: 'culture and society',
  daily_life: 'daily life and routines',
};

function makeQuestions(card: Part2CueCard) {
  const theme = THEME_LABELS[card.category];
  const subject = card.title.toLowerCase();
  const prompts = [
    `Why do people often value ${subject} in modern life?`,
    `How has the importance of ${subject} changed compared with the past?`,
    `Do you think younger and older people view ${subject} differently?`,
    `What are the advantages and disadvantages of focusing too much on ${theme}?`,
    `How might ${theme} change in the next ten years?`,
    `What role should families, schools, or communities play in shaping attitudes to ${theme}?`,
  ];

  return prompts.map((text, index) => ({
    id: `${card.id}-p3-q${index + 1}`,
    text,
    type: TYPE_ROTATION[index % TYPE_ROTATION.length],
    answerFramework: [
      'Give a direct position',
      'Explain the main reason',
      'Add an example or comparison',
      'Finish with a wider implication',
    ],
    vocabularyHints: ['in the long run', 'tends to', 'a major factor', 'compared with', 'from my perspective'],
  }));
}

export const PART3_DISCUSSION_SETS: Part3DiscussionSet[] = PART2_CUE_CARDS.map((card) => ({
  id: `p3-linked-${card.id.replace(/^p2-/, '')}`,
  title: `Discussion: ${card.title}`,
  theme: THEME_LABELS[card.category],
  linkedPart2CueCardIds: [card.id],
  questions: makeQuestions(card),
}));

export function getLinkedPart3Set(cueCardId?: string): Part3DiscussionSet {
  if (cueCardId) {
    const linked = PART3_DISCUSSION_SETS.find((set) => set.linkedPart2CueCardIds.includes(cueCardId));
    if (linked) return linked;
  }
  return PART3_DISCUSSION_SETS[Math.floor(Math.random() * PART3_DISCUSSION_SETS.length)];
}

