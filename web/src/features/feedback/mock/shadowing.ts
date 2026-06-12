import type { FeedbackResult } from '../types/feedback.types';

export const mockShadowing: FeedbackResult = {
  id: 'mock-shadowing-001',
  module: 'shadowing',
  overallScore: 78,
  scoreLabel: '78% similarity',
  teacherComment:
    'Your overall similarity is strong at 78%. Your speaking rate matches the original well, and most words are pronounced clearly. The main areas to improve are final consonant sounds (dropped in 3 words) and the rhythm of the second half of the sentence, which slows down compared to the original audio.',
  strengths: [
    'Your speaking rate closely matches the original audio.',
    'Most individual words are pronounced clearly.',
    'Sentence stress on key content words is mostly accurate.',
  ],
  topPriorities: [
    {
      title: 'Final consonant sounds',
      description:
        'The final /t/, /d/, and /s/ sounds were dropped or unclear in 3 words. Practise holding the final sound briefly before moving to the next word.',
      relatedIssueIds: ['issue-sh-01'],
    },
    {
      title: 'Maintain rhythm in the second half of sentences',
      description:
        'Your pace slows noticeably from the middle of longer sentences onwards. The original maintains a consistent rhythm throughout.',
      relatedIssueIds: ['issue-sh-02'],
    },
    {
      title: 'Word stress in "environment"',
      description:
        'The stress should be on the second syllable: en-VI-ron-ment. You placed it on the third syllable.',
      relatedIssueIds: ['issue-sh-03'],
    },
  ],
  criteria: [
    {
      id: 'pronunciation-sh',
      name: 'Pronunciation Accuracy',
      score: 80,
      scoreLabel: '80%',
      summary: 'Most words are accurate; 3 words have final consonant issues.',
      whyThisScore:
        'Overall pronunciation is clear and most words match the target. The 3 dropped final consonants and 1 word stress error reduce the score slightly.',
      strengths: ['Individual word pronunciation is mostly accurate.', 'Vowel sounds are clear.'],
      issueIds: ['issue-sh-01', 'issue-sh-03'],
      nextBandTarget: 'Focus on final consonant clarity and polysyllabic word stress.',
    },
    {
      id: 'rhythm-sh',
      name: 'Rhythm & Timing',
      score: 72,
      scoreLabel: '72%',
      summary: 'Good start but pace slows in the second half of each sentence.',
      whyThisScore:
        'The first half of each sentence closely matches the original rhythm. The second half consistently slows, creating a mismatch in timing.',
      strengths: ['Speaking rate at the start of sentences matches well.'],
      issueIds: ['issue-sh-02'],
      nextBandTarget: 'Practise the full sentence at speed without slowing at the end.',
    },
    {
      id: 'completeness-sh',
      name: 'Completeness',
      score: 95,
      scoreLabel: '95%',
      summary: 'Almost all words present; one word omitted.',
      whyThisScore:
        'You reproduced 19 of 20 words. One function word was skipped, which has minimal impact on meaning.',
      strengths: ['All content words were included.'],
      issueIds: ['issue-sh-04'],
      nextBandTarget: 'Pay attention to small function words (articles, prepositions) — they affect rhythm.',
    },
    {
      id: 'intonation-sh',
      name: 'Intonation',
      score: 75,
      scoreLabel: '75%',
      summary: 'Broadly correct; falls slightly flat at sentence endings.',
      whyThisScore:
        'Your intonation matches the broad pattern of the original. However, the falling intonation at sentence ends is less pronounced than in the original, making the speech sound slightly monotone.',
      strengths: ['Rising intonation in questions is accurate.'],
      issueIds: [],
      nextBandTarget: 'Exaggerate the falling intonation at the end of statements during practice.',
    },
  ],
  issues: [
    {
      id: 'issue-sh-01',
      criterionId: 'pronunciation-sh',
      group: 'must-fix',
      severity: 'high',
      type: 'final-consonant-dropped',
      title: 'Final consonants dropped in 3 words',
      originalText: '"worked" /wɜːkt/, "protected" /prəˈtektɪd/, "needs" /niːdz/',
      suggestedRevision:
        'Practise each word in isolation: "work-T", "protect-ED", "need-Z". Then practise in the full sentence.',
      explanation:
        'Dropping final consonants changes the word\'s shape and can affect meaning. For shadowing, exact reproduction of final sounds is scored.',
      impactOnScore: 'Reduces Pronunciation Accuracy.',
    },
    {
      id: 'issue-sh-02',
      criterionId: 'rhythm-sh',
      group: 'must-fix',
      severity: 'medium',
      type: 'rhythm-slowdown',
      title: 'Pace slows in the second half of sentences',
      explanation:
        'This often happens when attention shifts to listening ahead. Try practising each sentence in chunks — first half, second half, then full sentence at speed.',
      impactOnScore: 'Reduces Rhythm & Timing.',
    },
    {
      id: 'issue-sh-03',
      criterionId: 'pronunciation-sh',
      group: 'must-fix',
      severity: 'medium',
      type: 'word-stress-error',
      title: 'Incorrect stress in "environment"',
      originalText: 'en-vi-RON-ment (incorrect)',
      suggestedRevision: 'en-VI-ron-ment (correct: second syllable)',
      explanation:
        'English word stress is fixed and must be learned for each word. "Environment" always stresses the second syllable. Incorrect stress is one of the most common issues for Vietnamese learners.',
      impactOnScore: 'Reduces Pronunciation Accuracy.',
    },
    {
      id: 'issue-sh-04',
      criterionId: 'completeness-sh',
      group: 'nice-to-improve',
      severity: 'low',
      type: 'word-omitted',
      title: 'One function word omitted',
      originalText: 'the environment → "environment" (article dropped)',
      suggestedRevision: 'Include the article: "the environment".',
      explanation:
        'Articles are easy to drop in fast speech but they affect the rhythm of English sentences.',
      impactOnScore: 'Minor — reduces Completeness slightly.',
    },
  ],
  transcript:
    'Protecting environment is responsibility we all share, especially when it come to how we treat natural resource in our daily life.',
  audioAnalysis: {
    durationSeconds: 6.8,
    speakingRateWpm: 142,
    longPauseCount: 0,
    missingWords: ['the', 'a'],
    mispronouncedWords: [
      { word: 'worked', detectedProblem: 'Final /t/ dropped', suggestedPractice: 'Say "work-T" then "worked" 10 times' },
      { word: 'protected', detectedProblem: 'Final /d/ dropped', suggestedPractice: 'Say "protect-ED" slowly then at speed' },
      { word: 'environment', detectedProblem: 'Stress on 3rd syllable instead of 2nd', suggestedPractice: 'en-VI-ron-ment — clap on the VI syllable' },
    ],
    rhythmComment: 'Rhythm is consistent in the first half of each sentence but slows noticeably after the midpoint.',
    intonationComment: 'Intonation pattern is broadly correct but sentence-final falls are slightly flat.',
  },
  recommendedPractice: [
    {
      title: 'Final consonant drills',
      description: 'Choose 10 words ending in /t/, /d/, /s/, /z/. Practise each word alone then in a sentence. Record yourself and compare with native audio.',
      activityType: 'shadowing',
    },
    {
      title: 'Chunk-based rhythm practice',
      description: 'Split each sentence into two halves. Practise the second half at speed before adding the first. This helps prevent the common slowdown at sentence endings.',
    },
  ],
  createdAt: new Date().toISOString(),
};
