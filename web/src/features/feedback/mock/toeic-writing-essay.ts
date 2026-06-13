import type { FeedbackResult } from '../types/feedback.types';

export const mockToeicWritingEssay: FeedbackResult = {
  id: 'mock-toeic-writing-essay-001',
  module: 'toeic-writing-essay',
  overallScore: 4,
  scoreLabel: '4/5',
  teacherComment:
    'You take a clear position and organise the essay into recognisable paragraphs with topic sentences. Your reasons are relevant, but the examples stay general and one body paragraph stops before it is fully explained. Tighten your examples and vary your linking words and this becomes a solid 5/5.',
  strengths: [
    'A clear opinion is stated in the introduction and kept throughout.',
    'Each body paragraph opens with a topic sentence.',
    'Grammar is mostly accurate at the sentence level.',
  ],
  topPriorities: [
    {
      title: 'Make every reason carry a specific example',
      description:
        'Two of your reasons are explained in general terms. Add one concrete example (a real situation, a number, or personal experience) to each.',
      relatedIssueIds: ['issue-essay-01'],
    },
    {
      title: 'Vary your linking words',
      description:
        '"Firstly" and "In addition" appear repeatedly. Mix in "As a result", "For instance", and "On the other hand".',
      relatedIssueIds: ['issue-essay-02'],
    },
    {
      title: 'Restate your opinion in the conclusion',
      description:
        'The conclusion summarises the topic but does not clearly restate your view. End with a confident restatement.',
      relatedIssueIds: ['issue-essay-03'],
    },
  ],
  criteria: [
    {
      id: 'opinion-support',
      name: 'Opinion & Support',
      score: 4,
      scoreLabel: '4/5',
      summary: 'Clear position with relevant but under-developed support.',
      whyThisScore:
        'You state and maintain a position, but body paragraphs often give a reason without a specific example. A 5 requires fully developed reasons backed by concrete examples.',
      strengths: ['The position is clear and consistent.', 'Reasons are relevant to the prompt.'],
      issueIds: ['issue-essay-01'],
      nextBandTarget: 'Add a specific example to each reason and explain how it supports your opinion.',
    },
    {
      id: 'organisation',
      name: 'Organisation',
      score: 4,
      scoreLabel: '4/5',
      summary: 'Four-paragraph structure with some repetitive linking.',
      whyThisScore:
        'The essay has an introduction, two body paragraphs, and a conclusion. However, the same connectors repeat and the conclusion is weak.',
      strengths: ['Logical four-paragraph structure.', 'Topic sentences present.'],
      issueIds: ['issue-essay-02', 'issue-essay-03'],
      nextBandTarget: 'Use a wider range of connectors and finish with a clear restatement of your opinion.',
    },
    {
      id: 'vocabulary',
      name: 'Vocabulary',
      score: 3,
      scoreLabel: '3/5',
      summary: 'Adequate vocabulary with some repetition.',
      whyThisScore:
        'Word choice is generally appropriate, but "good" and "important" recur and limit the range shown.',
      strengths: ['Some topic-specific vocabulary is used correctly.'],
      issueIds: ['issue-essay-04'],
      nextBandTarget: 'Replace repeated basic words with more precise alternatives such as "beneficial" or "crucial".',
    },
    {
      id: 'grammar',
      name: 'Grammar',
      score: 4,
      scoreLabel: '4/5',
      summary: 'Mostly accurate with a mix of simple and complex sentences.',
      whyThisScore: 'Grammar is generally controlled; errors are occasional and do not obscure meaning.',
      strengths: ['Correct subject-verb agreement.', 'Some complex sentences attempted.'],
      issueIds: ['issue-essay-05'],
      nextBandTarget: 'Combine short related sentences and use a wider variety of complex structures.',
    },
  ],
  issues: [
    {
      id: 'issue-essay-01',
      criterionId: 'opinion-support',
      group: 'must-fix',
      severity: 'high',
      type: 'underdeveloped-paragraph',
      title: 'Reason lacks a specific example',
      originalText: 'Working for a large company is better because there are more opportunities.',
      suggestedRevision:
        'Working for a large company is better because there are more opportunities for advancement. For example, a friend of mine joined a multinational firm and was promoted twice in three years thanks to its structured training programme.',
      explanation:
        'The reason is stated but not proven. A concrete example shows the rater that you can develop an idea fully.',
      impactOnScore: 'Directly affects Opinion & Support — the most important criterion.',
    },
    {
      id: 'issue-essay-02',
      criterionId: 'organisation',
      group: 'must-fix',
      severity: 'medium',
      type: 'repetitive-linking-phrases',
      title: 'Overuse of "Firstly" and "In addition"',
      originalText: 'Firstly, … In addition, … In addition, …',
      suggestedRevision: 'Vary with "As a result,", "For instance,", "On the other hand,", "Consequently,".',
      explanation: 'Repeating the same connectors suggests limited control of cohesive devices.',
      impactOnScore: 'Reduces Organisation.',
    },
    {
      id: 'issue-essay-03',
      criterionId: 'organisation',
      group: 'must-fix',
      severity: 'medium',
      type: 'weak-conclusion',
      title: 'Conclusion does not restate the opinion',
      originalText: 'In conclusion, both options have advantages and people choose differently.',
      suggestedRevision:
        'In conclusion, I firmly believe that working for a large company offers greater long-term benefits, primarily because of its opportunities for growth and stability.',
      explanation: 'A strong conclusion restates your position confidently rather than sitting on the fence.',
      impactOnScore: 'Reduces Organisation and Opinion & Support.',
    },
    {
      id: 'issue-essay-04',
      criterionId: 'vocabulary',
      group: 'nice-to-improve',
      severity: 'low',
      type: 'word-repetition',
      title: 'Overuse of "good" and "important"',
      originalText: 'It is good for workers. This is an important point.',
      suggestedRevision: 'It is beneficial for workers. This is a crucial point.',
      explanation: 'Precise alternatives demonstrate a wider vocabulary range.',
      impactOnScore: 'Improves Vocabulary.',
    },
    {
      id: 'issue-essay-05',
      criterionId: 'grammar',
      group: 'nice-to-improve',
      severity: 'low',
      type: 'combine-short-sentences',
      title: 'Some short sentences could be combined',
      originalText: 'Large companies are stable. They offer benefits. This attracts workers.',
      suggestedRevision: 'Because large companies are stable and offer generous benefits, they tend to attract more workers.',
      explanation: 'Combining related short sentences shows a wider grammatical range.',
      impactOnScore: 'Improves Grammar.',
    },
  ],
  originalAnswer:
    'Some people prefer to work for a large company, while others prefer a small one. In my opinion, working for a large company is better.\n\nFirstly, working for a large company is better because there are more opportunities. Big companies have many departments and projects.\n\nIn addition, large companies are good for workers. They offer benefits. This is an important point.\n\nIn conclusion, both options have advantages and people choose differently.',
  improvedSample:
    'While some people prefer the close-knit atmosphere of a small business, I firmly believe that working for a large company is the better choice, mainly because of its opportunities for advancement and its financial stability.\n\nTo begin with, large companies offer far more room to grow. With many departments and ongoing projects, employees can move between roles and develop new skills. For example, a friend of mine joined a multinational firm and was promoted twice in three years thanks to its structured training programme — something a small company could rarely provide.\n\nFurthermore, large organisations tend to be more financially secure, which translates into better benefits for their staff. Comprehensive health insurance, paid training, and reliable salaries reduce stress and allow employees to plan their futures with confidence. This security is particularly valuable during economic downturns, when smaller firms are more likely to cut jobs.\n\nIn conclusion, although small companies have their own appeal, I am convinced that large companies provide greater long-term benefits through their opportunities for growth and their stability. For most workers seeking a lasting career, a large company is the wiser choice.',
  recommendedPractice: [
    {
      title: 'Develop reasons using Point → Explain → Example',
      description: 'Write two body paragraphs for three different opinion prompts, making sure each reason ends with a specific example.',
      activityType: 'toeic-writing-essay',
    },
    {
      title: 'Build a connector bank',
      description: 'Collect 10 linking phrases for contrast, result, and example, and practise using each one in a sentence.',
    },
  ],
  createdAt: new Date().toISOString(),
};
