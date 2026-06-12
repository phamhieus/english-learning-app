import type { FeedbackResult } from '../types/feedback.types';

export const mockIeltsWritingTask2: FeedbackResult = {
  id: 'mock-ielts-t2-opinion-001',
  module: 'ielts-writing-task-2',
  overallScore: 6.0,
  scoreLabel: 'Band 6.0',
  teacherComment:
    'Your essay presents a clear position and attempts to support it with reasons. The structure is recognisable and your ideas are relevant. However, your examples are quite general, and some paragraphs develop only one point without fully explaining it. Grammar is mostly accurate, but a few complex structures contain errors. To reach Band 6.5, focus on extending your body paragraphs with a specific example and ensuring your conclusion restates your position clearly.',
  strengths: [
    'Your position is stated clearly in the introduction.',
    'You use topic sentences to open each body paragraph.',
    'Grammar is mostly controlled at the sentence level.',
  ],
  topPriorities: [
    {
      title: 'Develop body paragraphs with specific examples',
      description:
        'Each body paragraph needs: a point, an explanation, and a concrete example. Currently, paragraphs often state a point but stop before the example.',
      relatedIssueIds: ['issue-t2-01'],
    },
    {
      title: 'Make the conclusion restate your opinion',
      description:
        'Your conclusion summarises the topic but does not clearly restate your view. End with a confident restatement.',
      relatedIssueIds: ['issue-t2-02'],
    },
    {
      title: 'Use a wider range of linking phrases',
      description:
        '"Furthermore" and "In addition" are used repeatedly. Vary with: "As a result", "This means that", "For instance".',
      relatedIssueIds: ['issue-t2-03'],
    },
  ],
  criteria: [
    {
      id: 'task-response',
      name: 'Task Response',
      score: 6.0,
      scoreLabel: 'Band 6.0',
      summary: 'Main ideas are relevant and position is clear, but paragraphs lack development.',
      whyThisScore:
        'You answer the question and state a position, but body paragraphs often present one idea without a specific supporting example. Band 7 requires fully extended and well-supported ideas.',
      strengths: [
        'The position is stated in the introduction and maintained.',
        'Both body paragraphs are relevant to the question.',
      ],
      issueIds: ['issue-t2-01', 'issue-t2-02'],
      nextBandTarget:
        'Add a specific real-world or personal example to each body paragraph. Ensure the conclusion restates your opinion in different words.',
    },
    {
      id: 'coherence-cohesion',
      name: 'Coherence & Cohesion',
      score: 6.0,
      scoreLabel: 'Band 6.0',
      summary: 'Clear structure with some overuse of linking phrases.',
      whyThisScore:
        'The essay has a clear four-paragraph structure and ideas are sequenced logically. However, the same linking phrases appear repeatedly, and some sentences are connected awkwardly.',
      strengths: [
        'Four-paragraph structure is logical.',
        'Topic sentences are present in each body paragraph.',
      ],
      issueIds: ['issue-t2-03'],
      nextBandTarget:
        'Vary linking phrases. Use "This means that", "As a consequence", "For example" to show more flexible cohesion.',
    },
    {
      id: 'lexical-resource',
      name: 'Lexical Resource',
      score: 6.0,
      scoreLabel: 'Band 6.0',
      summary: 'Adequate vocabulary with some natural phrases, but some repetition.',
      whyThisScore:
        'Vocabulary is generally appropriate and you attempt some less common words. However, "important" and "good" appear too often, and some collocations are slightly unnatural.',
      strengths: [
        'Uses some topic-specific vocabulary: "economic growth", "social inequality".',
        'Attempts paraphrasing of the question.',
      ],
      issueIds: ['issue-t2-04'],
      nextBandTarget:
        'Replace repeated words with synonyms. Instead of "important", try "crucial", "significant", "essential". Instead of "good", try "beneficial", "advantageous".',
    },
    {
      id: 'grammar',
      name: 'Grammatical Range & Accuracy',
      score: 6.5,
      scoreLabel: 'Band 6.5',
      summary: 'Mostly accurate with a mix of simple and complex sentences.',
      whyThisScore:
        'Grammar is generally accurate. You use some complex structures such as relative clauses and conditional sentences. Errors are occasional and do not usually obscure meaning.',
      strengths: [
        'Conditional sentences are used correctly.',
        'Subject-verb agreement is mostly accurate.',
      ],
      issueIds: ['issue-t2-05'],
      nextBandTarget:
        'Use a wider variety of complex structures: passive voice, noun clauses, and participial phrases. Reduce simple sentences that could be combined.',
    },
  ],
  issues: [
    {
      id: 'issue-t2-01',
      criterionId: 'task-response',
      group: 'must-fix',
      severity: 'high',
      type: 'underdeveloped-paragraph',
      title: 'Body paragraph lacks a specific example',
      originalText:
        'Furthermore, technology helps people communicate more easily. People can contact others around the world. This is very useful for business.',
      suggestedRevision:
        'Furthermore, technology has transformed communication, enabling people to connect with others across the world instantly. For example, companies such as Zoom and Microsoft Teams allow employees in different countries to hold meetings in real time, reducing travel costs and increasing productivity. This has been particularly valuable for small businesses expanding into international markets.',
      explanation:
        'The paragraph states a point and a general consequence, but stops without a specific example. An example shows the examiner that you can develop an idea fully.',
      impactOnScore: 'Directly reduces Task Response — the most important criterion for Task 2.',
    },
    {
      id: 'issue-t2-02',
      criterionId: 'task-response',
      group: 'must-fix',
      severity: 'medium',
      type: 'weak-conclusion',
      title: 'Conclusion does not restate your position clearly',
      originalText:
        'In conclusion, there are many aspects of this topic to consider and people have different opinions about it.',
      suggestedRevision:
        'In conclusion, I strongly believe that the benefits of technology outweigh the drawbacks, as it creates more opportunities than it removes. Governments and individuals should work together to ensure that these opportunities are accessible to everyone.',
      explanation:
        'The conclusion should restate your opinion confidently. Saying "people have different opinions" avoids commitment and weakens your Task Response score.',
      impactOnScore: 'Reduces Task Response.',
    },
    {
      id: 'issue-t2-03',
      criterionId: 'coherence-cohesion',
      group: 'must-fix',
      severity: 'medium',
      type: 'repetitive-linking-phrases',
      title: 'Overuse of "Furthermore" and "In addition"',
      originalText:
        'Furthermore, technology helps... Furthermore, the internet provides... In addition, there are many benefits...',
      suggestedRevision:
        'Use variety: "As a result,", "This means that", "For instance,", "On the other hand,", "Consequently,".',
      explanation:
        'Using the same linking phrases repeatedly suggests limited control of cohesive devices. Examiners look for a range of connectives used accurately.',
      impactOnScore: 'Reduces Coherence & Cohesion.',
    },
    {
      id: 'issue-t2-04',
      criterionId: 'lexical-resource',
      group: 'nice-to-improve',
      severity: 'low',
      type: 'word-repetition',
      title: 'Overuse of "important" and "good"',
      originalText:
        'It is very important that we consider this. Technology is good. This is an important issue.',
      suggestedRevision:
        '"It is crucial that we address this." / "Technology is beneficial." / "This is a significant concern."',
      explanation:
        '"Important" and "good" are very basic words. Replacing them with more precise alternatives demonstrates a wider vocabulary range.',
      impactOnScore: 'Minor — improves Lexical Resource.',
    },
    {
      id: 'issue-t2-05',
      criterionId: 'grammar',
      group: 'nice-to-improve',
      severity: 'low',
      type: 'combine-short-sentences',
      title: 'Some simple sentences could be combined',
      originalText: 'Technology changes quickly. People must adapt. This can be difficult.',
      suggestedRevision:
        'As technology changes rapidly, people are required to adapt continuously, which can be particularly challenging for older generations.',
      explanation:
        'Combining related short sentences into one complex sentence demonstrates a wider grammatical range.',
      impactOnScore: 'Improves Grammatical Range.',
    },
  ],
  originalAnswer:
    'In today\'s world, technology plays a very important role in our lives. Some people think that technology creates more problems than it solves, but I disagree with this view.\n\nFirstly, technology has made our lives more convenient. People can now do shopping, banking and communication from home. This saves a lot of time and is very good for busy people.\n\nFurthermore, technology helps people communicate more easily. People can contact others around the world. This is very useful for business.\n\nIn conclusion, there are many aspects of this topic to consider and people have different opinions about it.',
  improvedSample:
    'In today\'s rapidly evolving world, technology plays an increasingly central role in almost every aspect of daily life. While some argue that technological advancement creates more problems than it solves, I strongly believe that its benefits considerably outweigh its drawbacks.\n\nTo begin with, technology has made everyday tasks significantly more convenient and efficient. People can now carry out banking, shopping, and communication from the comfort of their own homes, saving valuable time and reducing the need for physical travel. For example, services such as online banking and e-commerce platforms like Shopee have transformed how millions of people manage their finances and make purchases, particularly benefiting those in remote areas who previously had limited access to these services.\n\nFurthermore, technology has fundamentally transformed global communication. Video conferencing tools such as Zoom and Microsoft Teams now allow employees in different countries to collaborate in real time, reducing travel costs and increasing productivity. This has been especially advantageous for small businesses seeking to expand into international markets without the expense of establishing overseas offices.\n\nIn conclusion, I firmly believe that the benefits of modern technology far outweigh its disadvantages, as it creates opportunities that were previously unimaginable. Governments and individuals should work together to ensure that these opportunities remain accessible to all members of society.',
  recommendedPractice: [
    {
      title: 'Develop body paragraphs using the PEEL structure',
      description: 'Practise Point → Explain → Example → Link. Write two body paragraphs using this structure for three different opinion essay questions.',
      activityType: 'ielts-writing-task-2',
    },
    {
      title: 'Expand vocabulary for common topics',
      description: 'Build a word bank for technology, education, and environment topics. Focus on collocations and topic-specific nouns.',
    },
  ],
  createdAt: new Date().toISOString(),
};
