import type { FeedbackResult } from '../types/feedback.types';

export const mockVirtualConversation: FeedbackResult = {
  id: 'mock-virtual-conv-001',
  module: 'virtual-conversation',
  overallScore: 65,
  scoreLabel: '65 / 100',
  teacherComment:
    'Your answers are relevant and your meaning is always clear — that\'s a great foundation. The main improvement area is answer length: most of your responses are a single short sentence, which makes the conversation feel stiff and prevents natural topic development. Aim to give 2–3 sentences per turn by adding a reason and a small detail or example.',
  strengths: [
    'All your answers are relevant to the question asked.',
    'Your grammar at the sentence level is accurate.',
    'You stay on topic throughout the conversation.',
  ],
  topPriorities: [
    {
      title: 'Extend answers to 2–3 sentences',
      description:
        'After your main answer, add "because..." or give a short example or detail. This makes conversation feel natural.',
      relatedIssueIds: ['issue-vc-01'],
    },
    {
      title: 'Ask follow-up questions',
      description:
        'Natural conversation involves both partners asking questions. After answering, try: "What about you?", "Do you agree?", "Have you ever...?"',
      relatedIssueIds: ['issue-vc-02'],
    },
    {
      title: 'Reduce repetition of "I like" and "I think"',
      description:
        'These phrases appeared 7 times. Vary with: "I enjoy", "In my opinion", "Personally", "From my experience".',
      relatedIssueIds: ['issue-vc-03'],
    },
  ],
  criteria: [
    {
      id: 'relevance',
      name: 'Relevance',
      score: 90,
      scoreLabel: '90 / 100',
      summary: 'All answers directly address the question.',
      whyThisScore: 'Every response is on-topic and answers what was asked.',
      strengths: ['Consistently relevant answers.'],
      issueIds: [],
      nextBandTarget: 'Maintain relevance while increasing answer length.',
    },
    {
      id: 'development',
      name: 'Topic Development',
      score: 50,
      scoreLabel: '50 / 100',
      summary: 'Points are stated but not developed with reasons or examples.',
      whyThisScore:
        'Answers typically contain one short statement without explanation. Developed answers show the ability to sustain a topic naturally.',
      strengths: ['Ideas are present but underdeveloped.'],
      issueIds: ['issue-vc-01'],
      nextBandTarget: 'Add "because + reason" or "for example + detail" after every main point.',
    },
    {
      id: 'naturalness',
      name: 'Naturalness & Fluency',
      score: 60,
      scoreLabel: '60 / 100',
      summary: 'Accurate but stiff — missing conversational back-and-forth.',
      whyThisScore:
        'You produce grammatically correct sentences but the conversation lacks the natural give-and-take of real dialogue. No follow-up questions were asked.',
      strengths: ['No awkward pauses or breakdowns in communication.'],
      issueIds: ['issue-vc-02', 'issue-vc-03'],
      nextBandTarget: 'Add one follow-up question per exchange. Vary your opening phrases.',
    },
  ],
  issues: [
    {
      id: 'issue-vc-01',
      criterionId: 'development',
      group: 'must-fix',
      severity: 'high',
      type: 'single-sentence-answer',
      title: 'Most answers are only one short sentence',
      originalText: 'I like travelling because it is interesting.',
      suggestedRevision:
        'I enjoy travelling because it allows me to experience different cultures and meet people from diverse backgrounds. For example, when I visited Da Nang last year, I tried several local dishes for the first time and it gave me a much better understanding of Vietnamese coastal life.',
      explanation:
        'One-sentence answers cover the minimum but feel abrupt in a real conversation. Extending your answer naturally shows fluency and willingness to communicate.',
      impactOnScore: 'Reduces Topic Development score significantly.',
    },
    {
      id: 'issue-vc-02',
      criterionId: 'naturalness',
      group: 'must-fix',
      severity: 'medium',
      type: 'no-follow-up-questions',
      title: 'No follow-up questions asked',
      explanation:
        'In a natural conversation, both participants ask questions. Asking "What about you?" or "Have you ever visited...?" shows engagement and keeps the conversation moving.',
      impactOnScore: 'Reduces Naturalness & Fluency.',
    },
    {
      id: 'issue-vc-03',
      criterionId: 'naturalness',
      group: 'nice-to-improve',
      severity: 'low',
      type: 'phrase-repetition',
      title: '"I like" and "I think" used 7 times',
      originalText: 'I like food. I think travel is good. I like music. I think it helps me.',
      suggestedRevision:
        '"I really enjoy food." / "In my opinion, travel is beneficial." / "Music is something I\'m passionate about." / "Personally, I find it very helpful."',
      explanation:
        'Varying your opening phrases makes your English sound more natural and demonstrates a wider vocabulary range.',
      impactOnScore: 'Minor — improves perceived vocabulary range.',
    },
  ],
  transcript:
    'AI: What do you like to do in your free time?\nYou: I like travelling because it is interesting.\n\nAI: Have you travelled anywhere recently?\nYou: Yes, I went to Da Nang.\n\nAI: What did you enjoy most about Da Nang?\nYou: I think the beach is good.\n\nAI: Would you recommend it to others?\nYou: Yes, I think it is nice.',
  improvedSample:
    'AI: What do you like to do in your free time?\nYou: I really enjoy travelling, mainly because it gives me the chance to experience different cultures and try new food. For example, I visited Da Nang last year and it was an amazing trip. What about you — do you travel much?\n\nAI: Have you travelled anywhere recently?\nYou: Yes, I went to Da Nang about six months ago. It was my first time visiting the central coast, and I was impressed by how beautiful the beaches were. Have you ever been there?',
  recommendedPractice: [
    {
      title: 'Practise extending answers with "because" and "for example"',
      description: 'For any question you answer, always add one "because..." sentence and one "for example..." sentence. Record yourself and listen back.',
      activityType: 'virtual-conversation',
    },
    {
      title: 'Question-asking practice',
      description: 'At the end of each answer, add one follow-up question: "What about you?", "Have you ever...?", "Do you agree?" Practise until it feels natural.',
    },
  ],
  createdAt: new Date().toISOString(),
};
