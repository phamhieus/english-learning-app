import { PART2_CUE_CARDS } from './part2CueCards';
import type { Part2CueCard, Part3DiscussionSet, Part3Question, Part3QuestionType } from '../types/ielts-speaking.types';

const DEFAULT_FRAMEWORK = [
  'Give a clear opinion',
  'Explain the main reason',
  'Add a real or hypothetical example',
  'Extend the answer to society or the future',
];

const DEFAULT_HINTS = ['in the long run', 'a major factor', 'from my perspective', 'compared with', 'it depends on'];

function question(id: string, text: string, type: Part3QuestionType): Part3Question {
  return {
    id,
    text,
    type,
    answerFramework: DEFAULT_FRAMEWORK,
    vocabularyHints: DEFAULT_HINTS,
  };
}

const PART2_THEME_LABELS: Record<Part2CueCard['category'], string> = {
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

const PART3_THEME_GROUPS: Record<string, string> = {
  Education: 'education and learning',
  'Learning Foreign Languages': 'education and learning',
  'Jobs and Careers': 'work and careers',
  'Technology and Smartphones': 'technology and modern life',
  'Social Media and Communication': 'technology and modern life',
  'Travel and Tourism': 'travel and mobility',
  'Health and Exercise': 'activities and habits',
  'Shopping and Advertising': 'possessions and daily choices',
  'Cities and Transport': 'places and communities',
  'Friends and Family': 'people and social influence',
  'Books, Films and Entertainment': 'culture and society',
};

export function getPart3ThemeGroup(theme: string) {
  return PART3_THEME_GROUPS[theme] ?? theme;
}

function makePart2LinkedQuestions(card: Part2CueCard): Part3Question[] {
  const theme = PART2_THEME_LABELS[card.category];
  const subject = card.title.toLowerCase();
  return [
    question(`${card.id}-p3-base-q1`, `Why do people often value ${subject} in modern life?`, 'reason'),
    question(`${card.id}-p3-base-q2`, `How has the importance of ${subject} changed compared with the past?`, 'change_over_time'),
    question(`${card.id}-p3-base-q3`, `Do younger and older people usually view ${subject} differently?`, 'comparison'),
    question(`${card.id}-p3-base-q4`, `What are the advantages and disadvantages of focusing too much on ${theme}?`, 'advantages_disadvantages'),
    question(`${card.id}-p3-base-q5`, `How might ${theme} change in the next ten years?`, 'prediction'),
    question(`${card.id}-p3-base-q6`, `What role should families, schools, or communities play in shaping attitudes to ${theme}?`, 'opinion'),
  ];
}

const PRESET_PART3_DISCUSSION_SETS: Part3DiscussionSet[] = [
  {
    id: 'p3-education-teacher',
    title: 'Education',
    theme: 'Education',
    linkedPart2CueCardIds: ['p2-teacher-influenced-you'],
    questions: [
      question('p3-education-q1', 'What qualities make someone a good teacher?', 'evaluation'),
      question('p3-education-q2', 'Do you think teachers should be strict with students?', 'opinion'),
      question('p3-education-q3', 'How has technology changed the way students learn?', 'change_over_time'),
      question('p3-education-q4', 'What are the advantages and disadvantages of online learning?', 'advantages_disadvantages'),
      question('p3-education-q5', 'Should schools focus more on practical skills or academic subjects?', 'comparison'),
      question('p3-education-q6', 'Do you think students will still need teachers in the future?', 'prediction'),
    ],
  },
  {
    id: 'p3-technology-smartphones',
    title: 'Technology and Smartphones',
    theme: 'Technology and Smartphones',
    linkedPart2CueCardIds: ['p2-useful-technology'],
    questions: [
      question('p3-technology-q1', 'How has technology changed people\'s daily lives?', 'change_over_time'),
      question('p3-technology-q2', 'Why do many people spend so much time using smartphones?', 'reason'),
      question('p3-technology-q3', 'Do smartphones make communication better or worse?', 'evaluation'),
      question('p3-technology-q4', 'Should parents limit the amount of time children spend on electronic devices?', 'opinion'),
      question('p3-technology-q5', 'Are older people more likely to have difficulty using new technology?', 'comparison'),
      question('p3-technology-q6', 'What types of technology may become common in the future?', 'prediction'),
    ],
  },
  {
    id: 'p3-jobs-careers',
    title: 'Jobs and Careers',
    theme: 'Jobs and Careers',
    linkedPart2CueCardIds: ['p2-future-job'],
    questions: [
      question('p3-jobs-q1', 'What factors do people usually consider when choosing a job?', 'reason'),
      question('p3-jobs-q2', 'Is job satisfaction more important than a high salary?', 'comparison'),
      question('p3-jobs-q3', 'Why do some people change jobs frequently?', 'reason'),
      question('p3-jobs-q4', 'What are the benefits of working from home?', 'advantages_disadvantages'),
      question('p3-jobs-q5', 'What problems can people face when working remotely?', 'problem_solution'),
      question('p3-jobs-q6', 'Do you think artificial intelligence will replace some jobs in the future?', 'prediction'),
    ],
  },
  {
    id: 'p3-travel-tourism',
    title: 'Travel and Tourism',
    theme: 'Travel and Tourism',
    linkedPart2CueCardIds: ['p2-place-enjoyed-visiting'],
    questions: [
      question('p3-travel-q1', 'Why do people enjoy travelling?', 'reason'),
      question('p3-travel-q2', 'What are the benefits of travelling to other countries?', 'advantages_disadvantages'),
      question('p3-travel-q3', 'How can tourism help local communities?', 'cause_effect'),
      question('p3-travel-q4', 'What problems can tourism cause?', 'problem_solution'),
      question('p3-travel-q5', 'Should governments limit the number of tourists visiting certain places?', 'opinion'),
      question('p3-travel-q6', 'Do you think people will travel more or less in the future?', 'prediction'),
    ],
  },
  {
    id: 'p3-environment',
    title: 'Environment',
    theme: 'Environment',
    linkedPart2CueCardIds: ['p2-natural-place-visit'],
    questions: [
      question('p3-environment-q1', 'What are the most serious environmental problems in your country?', 'evaluation'),
      question('p3-environment-q2', 'Why do some people pay little attention to environmental issues?', 'reason'),
      question('p3-environment-q3', 'What can individuals do to protect the environment?', 'problem_solution'),
      question('p3-environment-q4', 'Should companies be responsible for reducing plastic waste?', 'opinion'),
      question('p3-environment-q5', 'Is public transport an effective way to reduce pollution?', 'evaluation'),
      question('p3-environment-q6', 'Should environmental education be taught at school?', 'opinion'),
    ],
  },
  {
    id: 'p3-health-exercise',
    title: 'Health and Exercise',
    theme: 'Health and Exercise',
    linkedPart2CueCardIds: ['p2-sport-activity-enjoy'],
    questions: [
      question('p3-health-q1', 'Why do some people find it difficult to exercise regularly?', 'reason'),
      question('p3-health-q2', 'Do young people exercise enough nowadays?', 'evaluation'),
      question('p3-health-q3', 'What can schools do to encourage children to be more active?', 'problem_solution'),
      question('p3-health-q4', 'Is it better to exercise alone or with other people?', 'comparison'),
      question('p3-health-q5', 'Should governments provide more public spaces for exercise?', 'opinion'),
      question('p3-health-q6', 'How has modern technology affected people\'s health?', 'change_over_time'),
    ],
  },
  {
    id: 'p3-social-media-communication',
    title: 'Social Media and Communication',
    theme: 'Social Media and Communication',
    linkedPart2CueCardIds: ['p2-person-communicate-with'],
    questions: [
      question('p3-social-q1', 'How has the way people communicate changed in recent years?', 'change_over_time'),
      question('p3-social-q2', 'What are the benefits of social media?', 'advantages_disadvantages'),
      question('p3-social-q3', 'What problems can social media cause?', 'problem_solution'),
      question('p3-social-q4', 'Do people communicate less effectively when they mainly use text messages?', 'evaluation'),
      question('p3-social-q5', 'Should children be allowed to use social media?', 'opinion'),
      question('p3-social-q6', 'Will face-to-face communication become less common in the future?', 'prediction'),
    ],
  },
  {
    id: 'p3-shopping-advertising',
    title: 'Shopping and Advertising',
    theme: 'Shopping and Advertising',
    linkedPart2CueCardIds: ['p2-useful-item-bought'],
    questions: [
      question('p3-shopping-q1', 'Why do people sometimes buy things that they do not need?', 'reason'),
      question('p3-shopping-q2', 'How does advertising influence customers?', 'cause_effect'),
      question('p3-shopping-q3', 'Are advertisements more effective on social media than on television?', 'comparison'),
      question('p3-shopping-q4', 'Why is online shopping becoming more popular?', 'reason'),
      question('p3-shopping-q5', 'What are the disadvantages of shopping online?', 'advantages_disadvantages'),
      question('p3-shopping-q6', 'Should advertisements aimed at children be restricted?', 'opinion'),
    ],
  },
  {
    id: 'p3-cities-transport',
    title: 'Cities and Transport',
    theme: 'Cities and Transport',
    linkedPart2CueCardIds: ['p2-city-to-visit'],
    questions: [
      question('p3-cities-q1', 'Why do many people move from rural areas to cities?', 'reason'),
      question('p3-cities-q2', 'What problems do large cities usually face?', 'problem_solution'),
      question('p3-cities-q3', 'How can governments reduce traffic congestion?', 'problem_solution'),
      question('p3-cities-q4', 'Should governments spend more money on public transport?', 'opinion'),
      question('p3-cities-q5', 'What are the advantages of cycling in cities?', 'advantages_disadvantages'),
      question('p3-cities-q6', 'Do you think cities will become better places to live in the future?', 'prediction'),
    ],
  },
  {
    id: 'p3-friends-family',
    title: 'Friends and Family',
    theme: 'Friends and Family',
    linkedPart2CueCardIds: ['p2-important-friend'],
    questions: [
      question('p3-family-q1', 'Is it easier to make friends when people are young?', 'comparison'),
      question('p3-family-q2', 'What qualities are important in a good friend?', 'evaluation'),
      question('p3-family-q3', 'Can online friendships be as meaningful as face-to-face friendships?', 'comparison'),
      question('p3-family-q4', 'Why do some people find it difficult to maintain long-term friendships?', 'reason'),
      question('p3-family-q5', 'How has family life changed compared with the past?', 'change_over_time'),
      question('p3-family-q6', 'Do people spend enough time with their families nowadays?', 'evaluation'),
    ],
  },
  {
    id: 'p3-books-films-entertainment',
    title: 'Books, Films and Entertainment',
    theme: 'Books, Films and Entertainment',
    linkedPart2CueCardIds: ['p2-film-enjoyed'],
    questions: [
      question('p3-entertainment-q1', 'Why do people enjoy watching films?', 'reason'),
      question('p3-entertainment-q2', 'Are films an effective way to learn about other cultures?', 'evaluation'),
      question('p3-entertainment-q3', 'Do young people read fewer books than previous generations?', 'change_over_time'),
      question('p3-entertainment-q4', 'What are the benefits of reading books?', 'advantages_disadvantages'),
      question('p3-entertainment-q5', 'Should parents control the types of films their children watch?', 'opinion'),
      question('p3-entertainment-q6', 'How might entertainment change in the future?', 'prediction'),
    ],
  },
  {
    id: 'p3-foreign-languages',
    title: 'Learning Foreign Languages',
    theme: 'Learning Foreign Languages',
    linkedPart2CueCardIds: ['p2-used-foreign-language'],
    questions: [
      question('p3-languages-q1', 'Why do people learn foreign languages?', 'reason'),
      question('p3-languages-q2', 'What difficulties do people face when learning a new language?', 'problem_solution'),
      question('p3-languages-q3', 'Is it better to learn a foreign language at a young age?', 'comparison'),
      question('p3-languages-q4', 'Can people learn a language effectively through online courses?', 'evaluation'),
      question('p3-languages-q5', 'Is travelling abroad necessary to become fluent in a language?', 'opinion'),
      question('p3-languages-q6', 'Will translation technology reduce the need to learn foreign languages?', 'prediction'),
    ],
  },
];

const PART2_GENERATED_DISCUSSION_SETS: Part3DiscussionSet[] = PART2_CUE_CARDS.map((card) => ({
  id: `p3-linked-${card.id.replace(/^p2-/, '')}`,
  title: `Discussion: ${card.title}`,
  theme: PART2_THEME_LABELS[card.category],
  linkedPart2CueCardIds: [card.id],
  questions: makePart2LinkedQuestions(card),
}));

export const PART3_DISCUSSION_SETS: Part3DiscussionSet[] = [
  ...PRESET_PART3_DISCUSSION_SETS,
  ...PART2_GENERATED_DISCUSSION_SETS,
];

const GENERATED_QUESTION_BANK: Record<string, { text: string; type: Part3QuestionType }[]> = {
  Education: [
    { text: 'How can schools prepare students for life outside the classroom?', type: 'problem_solution' },
    { text: 'Why do some students learn better independently than with a teacher?', type: 'reason' },
    { text: 'Should exams be the main way to measure students\' ability?', type: 'evaluation' },
    { text: 'How important is creativity in modern education?', type: 'evaluation' },
    { text: 'What role should parents play in children\'s education?', type: 'opinion' },
    { text: 'Do you think education will become more personalized in the future?', type: 'prediction' },
  ],
  'Technology and Smartphones': [
    { text: 'How does technology affect the way people solve everyday problems?', type: 'cause_effect' },
    { text: 'Why are some people reluctant to use new technology?', type: 'reason' },
    { text: 'Should companies be responsible for helping users manage screen time?', type: 'opinion' },
    { text: 'What are the risks of depending too much on digital devices?', type: 'advantages_disadvantages' },
    { text: 'How might smartphones change in the next ten years?', type: 'prediction' },
    { text: 'Do you think technology has made people more patient or less patient?', type: 'evaluation' },
  ],
  'Jobs and Careers': [
    { text: 'How important is career planning for young people?', type: 'evaluation' },
    { text: 'Why do some people prefer flexible work to stable office jobs?', type: 'reason' },
    { text: 'Should schools teach students more about choosing a career?', type: 'opinion' },
    { text: 'What skills will be most valuable in future workplaces?', type: 'prediction' },
    { text: 'How can companies keep employees motivated?', type: 'problem_solution' },
    { text: 'Is it better to specialize in one career or develop many skills?', type: 'comparison' },
  ],
  'Travel and Tourism': [
    { text: 'How does travelling change people\'s understanding of the world?', type: 'cause_effect' },
    { text: 'Why do some people prefer travelling locally rather than abroad?', type: 'reason' },
    { text: 'Should tourists learn about local customs before visiting a place?', type: 'opinion' },
    { text: 'What kinds of places are likely to attract tourists in the future?', type: 'prediction' },
    { text: 'How can popular destinations protect local culture?', type: 'problem_solution' },
    { text: 'Is independent travel better than package tours?', type: 'comparison' },
  ],
  Environment: [
    { text: 'Why is it difficult for people to change habits that harm the environment?', type: 'reason' },
    { text: 'Should environmental rules be stricter for businesses than for individuals?', type: 'comparison' },
    { text: 'How can cities encourage people to live more sustainably?', type: 'problem_solution' },
    { text: 'Do you think young people care more about the environment than older people?', type: 'comparison' },
    { text: 'What environmental changes might people face in the future?', type: 'prediction' },
    { text: 'Is recycling enough to solve waste problems?', type: 'evaluation' },
  ],
  'Health and Exercise': [
    { text: 'Why do people often ignore health advice?', type: 'reason' },
    { text: 'Should workplaces do more to support employees\' health?', type: 'opinion' },
    { text: 'How can technology help people become healthier?', type: 'problem_solution' },
    { text: 'Is mental health as important as physical health?', type: 'comparison' },
    { text: 'What health problems may become more common in the future?', type: 'prediction' },
    { text: 'Do public health campaigns really change people\'s behaviour?', type: 'evaluation' },
  ],
  'Social Media and Communication': [
    { text: 'Why do people share personal information online?', type: 'reason' },
    { text: 'How has social media changed public opinion?', type: 'change_over_time' },
    { text: 'Should online platforms control harmful content more strictly?', type: 'opinion' },
    { text: 'Is online communication suitable for serious conversations?', type: 'evaluation' },
    { text: 'How might communication technology develop in the future?', type: 'prediction' },
    { text: 'Are people more connected or more isolated because of social media?', type: 'comparison' },
  ],
  'Shopping and Advertising': [
    { text: 'Why are brand names important to some customers?', type: 'reason' },
    { text: 'How has online shopping changed local businesses?', type: 'cause_effect' },
    { text: 'Should influencers have to label paid advertisements clearly?', type: 'opinion' },
    { text: 'What makes an advertisement memorable?', type: 'evaluation' },
    { text: 'Will physical shops become less important in the future?', type: 'prediction' },
    { text: 'Is it better to buy fewer high-quality products or cheaper items more often?', type: 'comparison' },
  ],
  'Cities and Transport': [
    { text: 'Why is traffic such a common problem in big cities?', type: 'reason' },
    { text: 'How can city design improve people\'s quality of life?', type: 'problem_solution' },
    { text: 'Should private cars be restricted in city centres?', type: 'opinion' },
    { text: 'What are the disadvantages of living in very dense cities?', type: 'advantages_disadvantages' },
    { text: 'How might public transport change in the future?', type: 'prediction' },
    { text: 'Is it better for cities to grow upwards or outwards?', type: 'comparison' },
  ],
  'Friends and Family': [
    { text: 'Why do friendships sometimes become weaker over time?', type: 'reason' },
    { text: 'How can families stay close when they live far apart?', type: 'problem_solution' },
    { text: 'Should parents try to be friends with their children?', type: 'opinion' },
    { text: 'Are small families better than large families?', type: 'comparison' },
    { text: 'How might family relationships change in the future?', type: 'prediction' },
    { text: 'What makes a relationship last for a long time?', type: 'evaluation' },
  ],
  'Books, Films and Entertainment': [
    { text: 'Why do people enjoy stories about imaginary worlds?', type: 'reason' },
    { text: 'How has streaming changed the entertainment industry?', type: 'change_over_time' },
    { text: 'Should governments support local film and book industries?', type: 'opinion' },
    { text: 'Are books usually more educational than films?', type: 'comparison' },
    { text: 'What are the disadvantages of having too much entertainment available?', type: 'advantages_disadvantages' },
    { text: 'Will traditional cinemas still be popular in the future?', type: 'prediction' },
  ],
  'Learning Foreign Languages': [
    { text: 'Why do some learners lose motivation when studying a language?', type: 'reason' },
    { text: 'How can schools make language learning more practical?', type: 'problem_solution' },
    { text: 'Should everyone learn at least one foreign language?', type: 'opinion' },
    { text: 'Is speaking more important than grammar when learning a language?', type: 'comparison' },
    { text: 'How has technology changed language learning?', type: 'change_over_time' },
    { text: 'What languages may become more useful in the future?', type: 'prediction' },
  ],
};

function seededRandom(seed: string) {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], seed: string) {
  const random = seededRandom(seed);
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

function makeGeneratedQuestionsForSet(baseSet: Part3DiscussionSet) {
  const subject = baseSet.title.replace(/^Discussion:\s*/i, '').toLowerCase();
  const theme = baseSet.theme.toLowerCase();
  return [
    { text: `Why might ${subject} be important to people in your society?`, type: 'reason' as const },
    { text: `How have people's attitudes to ${subject} changed in recent years?`, type: 'change_over_time' as const },
    { text: `Do you think ${subject} matters more to young people or older people?`, type: 'comparison' as const },
    { text: `What problems can happen when people pay too much attention to ${theme}?`, type: 'problem_solution' as const },
    { text: `Should schools or families teach people more about ${theme}?`, type: 'opinion' as const },
    { text: `How do you think ${theme} will change in the future?`, type: 'prediction' as const },
    { text: `What are the advantages and disadvantages of modern changes in ${theme}?`, type: 'advantages_disadvantages' as const },
    { text: `How does ${theme} affect everyday life in your country?`, type: 'cause_effect' as const },
  ];
}

export function generatePart3DiscussionSet(baseSet: Part3DiscussionSet, sessionKey: string, count = 5): Part3DiscussionSet {
  const generatedSource = GENERATED_QUESTION_BANK[baseSet.theme] ?? makeGeneratedQuestionsForSet(baseSet);
  const generatedQuestions = generatedSource.map((item, index) =>
    question(`${baseSet.id}-generated-${sessionKey}-${index + 1}`, item.text, item.type),
  );
  const questionPool = [...baseSet.questions, ...generatedQuestions];
  const selectedQuestions = shuffled(questionPool, `${baseSet.id}-${sessionKey}`).slice(0, count);

  return {
    ...baseSet,
    id: `${baseSet.id}--session-${sessionKey}`,
    questions: selectedQuestions.map((item, index) => ({
      ...item,
      id: `${baseSet.id}-session-${sessionKey}-q${index + 1}`,
    })),
  };
}

export function getLinkedPart3Set(cueCardId?: string): Part3DiscussionSet {
  if (cueCardId) {
    const linked = PART3_DISCUSSION_SETS.find((set) => set.linkedPart2CueCardIds.includes(cueCardId));
    if (linked) return linked;
  }
  return PART3_DISCUSSION_SETS[0];
}
