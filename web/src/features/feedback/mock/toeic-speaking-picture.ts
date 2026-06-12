import type { FeedbackResult } from '../types/feedback.types';

export const mockToeicSpeakingPicture: FeedbackResult = {
  id: 'mock-toeic-sp-pic-001',
  module: 'toeic-speaking-picture-description',
  overallScore: 70,
  scoreLabel: '70 / 100',
  teacherComment:
    'You correctly identified the main subject and action in the picture. However, your description is very short — only one sentence — and does not mention the background, location, or any other visible elements. For TOEIC Picture Description, a strong answer describes the main subject, the action, the setting, and adds one inference about the context.',
  strengths: [
    'You identified the main subject (a woman) and the main action (typing on a laptop) correctly.',
    'Your sentence structure is grammatically accurate.',
    'Your pronunciation was clear and easy to understand.',
  ],
  topPriorities: [
    {
      title: 'Describe the setting and background',
      description:
        'After describing the main subject, mention where the action is taking place and what surrounds the person or object.',
      relatedIssueIds: ['issue-pic-01'],
    },
    {
      title: 'Add an inference about the situation',
      description:
        'Use "she appears to be", "it looks like", or "she might be" to make a reasonable guess about the context.',
      relatedIssueIds: ['issue-pic-02'],
    },
    {
      title: 'Use all 30 seconds available',
      description:
        'Your answer lasted approximately 8 seconds. Aim to speak for the full 30 seconds by adding description layers.',
      relatedIssueIds: ['issue-pic-01'],
    },
  ],
  criteria: [
    {
      id: 'content-coverage',
      name: 'Content Coverage',
      score: 50,
      scoreLabel: '50 / 100',
      summary: 'Main subject identified but background, location, and context are missing.',
      whyThisScore:
        'You described the central figure accurately but omitted all surrounding context. A complete picture description covers: main subject → action → location/setting → background details → inference.',
      strengths: ['Main subject and action identified correctly.'],
      issueIds: ['issue-pic-01', 'issue-pic-02'],
      nextBandTarget:
        'Describe at least 3 elements: who, what they are doing, where they are, and what else you can see.',
    },
    {
      id: 'vocabulary-pic',
      name: 'Vocabulary',
      score: 75,
      scoreLabel: '75 / 100',
      summary: 'Basic vocabulary is accurate but limited to the central object.',
      whyThisScore:
        'The words you used are correct. However, you only describe one element, so vocabulary range is difficult to assess fully.',
      strengths: ['Word choice for the main action is accurate.'],
      issueIds: ['issue-pic-03'],
      nextBandTarget:
        'Use location prepositions (in the foreground, in the background, on the left, beside), descriptive adjectives, and context phrases.',
    },
    {
      id: 'grammar-pic',
      name: 'Grammar',
      score: 85,
      scoreLabel: '85 / 100',
      summary: 'Grammatically accurate sentence.',
      whyThisScore:
        'The sentence you produced is grammatically correct. The score is limited by the small quantity of language used.',
      strengths: ['Present continuous tense used correctly.'],
      issueIds: [],
      nextBandTarget: 'Maintain this accuracy while producing 4–5 sentences.',
    },
    {
      id: 'fluency-pic',
      name: 'Fluency & Delivery',
      score: 80,
      scoreLabel: '80 / 100',
      summary: 'Clear delivery but answer ends too quickly.',
      whyThisScore:
        'Your delivery is confident and clear, but the answer is significantly shorter than the 30-second window. Pausing mid-answer to recall more details would be better than finishing after 8 seconds.',
      strengths: ['Clear and confident delivery.', 'No hesitation or filler words.'],
      issueIds: [],
      nextBandTarget: 'Practise speaking for the full 30 seconds. Use all available time.',
    },
  ],
  issues: [
    {
      id: 'issue-pic-01',
      criterionId: 'content-coverage',
      group: 'must-fix',
      severity: 'high',
      type: 'missing-setting-description',
      title: 'Setting and background not described',
      originalText: 'A woman is typing on a laptop.',
      suggestedRevision:
        'A woman is sitting at a wooden desk and typing on a laptop. In front of her, there are several documents and a coffee cup. The room appears to be an office, as there is a bookshelf visible in the background.',
      explanation:
        'After identifying the main subject and action, always describe: where the person is located, what surrounds them, and any other objects in the frame. This is the most common reason for a low TOEIC Picture Description score.',
      impactOnScore: 'Reduces Content Coverage from ~80 to ~50.',
    },
    {
      id: 'issue-pic-02',
      criterionId: 'content-coverage',
      group: 'must-fix',
      severity: 'medium',
      type: 'missing-inference',
      title: 'No inference about the context',
      originalText: 'A woman is typing on a laptop.',
      suggestedRevision:
        'She appears to be working, possibly reviewing a report or responding to emails.',
      explanation:
        'TOEIC examiners reward candidates who show they can interpret what is happening, not just list objects. Use "appears to be", "it looks like", or "might be" to add a reasonable inference.',
      impactOnScore: 'Reduces Content Coverage.',
    },
    {
      id: 'issue-pic-03',
      criterionId: 'vocabulary-pic',
      group: 'nice-to-improve',
      severity: 'low',
      type: 'limited-vocabulary-range',
      title: 'Vocabulary limited to one object',
      explanation:
        'Learn location and description phrases for picture tasks: "in the foreground", "on the right-hand side", "in the background", "partially visible", "appears to be", "is surrounded by".',
      impactOnScore: 'Improves Vocabulary score.',
    },
  ],
  transcript: 'A woman is typing on a laptop.',
  improvedSample:
    'A woman is sitting at a wooden desk and typing on a laptop computer. On the desk in front of her, there are several documents and what appears to be a coffee cup. She is dressed professionally, wearing a white blouse, so she might be working in an office environment. In the background, a bookshelf is partially visible. The overall scene suggests that she is focused on her work, possibly completing a report or responding to emails.',
  recommendedPractice: [
    {
      title: 'Practise the 5-layer description framework',
      description: 'For every picture: 1) Who / what is the main subject? 2) What are they doing? 3) Where are they? 4) What else can you see? 5) What can you infer?',
      activityType: 'toeic-speaking-picture-description',
    },
    {
      title: 'Location vocabulary drill',
      description: 'Practise using: in the foreground, in the background, on the left/right, in the centre, beside, behind, in front of. Describe 5 pictures using these phrases.',
    },
  ],
  createdAt: new Date().toISOString(),
};
