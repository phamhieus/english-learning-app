import type { FeedbackResult } from '../types/feedback.types';

export const mockIeltsWritingTask1: FeedbackResult = {
  id: 'mock-ielts-t1-map-001',
  module: 'ielts-writing-task-1',
  overallScore: 5.5,
  scoreLabel: 'Band 5.5',
  teacherComment:
    'Your response identifies several important changes to the campus layout and attempts a logical structure. However, the overview is too vague to summarise the key transformation, and grammar errors — particularly with verb tense and plural nouns — appear consistently throughout. Focus first on writing a clear overview that captures the overall change, then check singular/plural accuracy.',
  strengths: [
    'You identified several key features, including the car park relocation and new sports facilities.',
    'You used some suitable map-related vocabulary such as "relocated" and "demolished".',
    'Basic paragraph organisation is present — you separate the north and south areas.',
  ],
  topPriorities: [
    {
      title: 'Write a clear overview',
      description:
        'Summarise the most significant overall change before describing individual features. Do not list every detail in the overview.',
      relatedIssueIds: ['issue-t1-01'],
    },
    {
      title: 'Group related changes in the same paragraph',
      description:
        'Pair the car park removal and the new accommodation block — both affect the eastern side of the campus.',
      relatedIssueIds: ['issue-t1-02'],
    },
    {
      title: 'Check verb tense and singular/plural nouns',
      description:
        'Use past simple or passive to describe map changes. Check singular/plural carefully for nouns like "hall of residence".',
      relatedIssueIds: ['issue-t1-03', 'issue-t1-04'],
    },
  ],
  criteria: [
    {
      id: 'task-achievement',
      name: 'Task Achievement',
      score: 5.5,
      scoreLabel: 'Band 5.5',
      summary: 'Most important changes are mentioned, but the overview is unclear.',
      whyThisScore:
        'You describe several features accurately, but the overview does not clearly state the overall transformation. Band 6 requires a clear overview that identifies the main trend or overall change without simply listing details.',
      strengths: [
        'Mentions the car park relocation and new sports centre.',
        'Covers both the 1990 and 2020 plans.',
      ],
      issueIds: ['issue-t1-01', 'issue-t1-02'],
      nextBandTarget:
        'Write one or two sentences that summarise the overall change (e.g., the campus became more academic-focused and expanded facilities). Then group the most important features together.',
    },
    {
      id: 'coherence-cohesion',
      name: 'Coherence & Cohesion',
      score: 5.5,
      scoreLabel: 'Band 5.5',
      summary: 'Basic organisation is present but paragraphing could be more logical.',
      whyThisScore:
        'You use some linking words ("firstly", "in addition"), but they are sometimes mechanical. Some changes that are geographically related are placed in different paragraphs, making the response feel slightly disjointed.',
      strengths: [
        'You separate the overview from the body paragraphs.',
        'Linking words are present, even if overused.',
      ],
      issueIds: ['issue-t1-02'],
      nextBandTarget:
        'Group geographically or thematically related changes. Vary your linking phrases — avoid starting every sentence with "In addition".',
    },
    {
      id: 'lexical-resource',
      name: 'Lexical Resource',
      score: 5,
      scoreLabel: 'Band 5',
      summary: 'Some appropriate vocabulary, but several expressions are inaccurate or unnatural.',
      whyThisScore:
        'You use some suitable words like "relocated" and "demolished", but also several unnatural phrases that reduce the score. Collocations such as "was resized bigger" and "a creation area" suggest limited control over less common vocabulary.',
      strengths: [
        'Uses "relocated" and "demolished" correctly.',
        'Attempts topic-specific vocabulary.',
      ],
      issueIds: ['issue-t1-05', 'issue-t1-06'],
      nextBandTarget:
        'Learn natural collocations for map descriptions: "was extended", "was converted into", "was replaced by", "a recreational area". Reduce repetition of "built" and "created".',
    },
    {
      id: 'grammar',
      name: 'Grammatical Range & Accuracy',
      score: 5,
      scoreLabel: 'Band 5',
      summary: 'Frequent errors with verb tense and noun forms reduce accuracy.',
      whyThisScore:
        'Errors appear frequently enough to cause some difficulty for the reader. Plural noun errors and tense inconsistencies are the most common problems.',
      strengths: [
        'Attempts some passive constructions ("was replaced by").',
        'Basic sentence structure is mostly understandable.',
      ],
      issueIds: ['issue-t1-03', 'issue-t1-04'],
      nextBandTarget:
        'Use past simple passive consistently: "was built", "was demolished", "was replaced". Check all nouns: "hall of residence" (not "halls of residence building").',
    },
  ],
  issues: [
    {
      id: 'issue-t1-01',
      criterionId: 'task-achievement',
      group: 'must-fix',
      severity: 'high',
      type: 'missing-clear-overview',
      title: 'Overview does not summarise the main transformation',
      originalText:
        'There are a lot of new buildings and recreation facilities built during this period.',
      suggestedRevision:
        'Overall, the campus underwent significant development between 1990 and 2020, with new academic and recreational facilities replacing the older car park and open areas.',
      explanation:
        'The overview should state the overall change — not just mention that new buildings exist. Examiners expect a summary of the key transformation in one or two sentences.',
      impactOnScore: 'Directly reduces Task Achievement — this is the highest impact issue.',
    },
    {
      id: 'issue-t1-02',
      criterionId: 'coherence-cohesion',
      group: 'must-fix',
      severity: 'medium',
      type: 'poor-paragraph-grouping',
      title: 'Related changes are split across paragraphs',
      originalText:
        'The car park was removed. In addition, a new library was added in the south.',
      suggestedRevision:
        'On the eastern side of the campus, the car park was removed and replaced by a new accommodation block. Meanwhile, the southern area saw the addition of a new library and sports centre.',
      explanation:
        'Grouping geographically or thematically related changes together makes the response easier to follow and shows better organisation.',
      impactOnScore: 'Reduces Coherence & Cohesion.',
    },
    {
      id: 'issue-t1-03',
      criterionId: 'grammar',
      group: 'must-fix',
      severity: 'high',
      type: 'verb-tense-error',
      title: 'Inconsistent verb tense in map descriptions',
      originalText: 'Now they were merged as a new car park.',
      suggestedRevision: 'They were subsequently merged into a single car park.',
      explanation:
        '"Now they were merged" mixes present and past tense. Map descriptions use past simple or passive throughout. Avoid "now" with past tense.',
      impactOnScore: 'Reduces Grammatical Range & Accuracy.',
    },
    {
      id: 'issue-t1-04',
      criterionId: 'grammar',
      group: 'must-fix',
      severity: 'medium',
      type: 'plural-noun-error',
      title: 'Incorrect noun form',
      originalText: 'There was only one halls of residence building.',
      suggestedRevision: 'There was only one hall of residence.',
      explanation:
        '"Halls of residence" is plural. "Hall of residence" is the singular form. Adding "building" after it is also redundant.',
      impactOnScore: 'Reduces Grammatical Range & Accuracy.',
    },
    {
      id: 'issue-t1-05',
      criterionId: 'lexical-resource',
      group: 'must-fix',
      severity: 'high',
      type: 'unnatural-collocation',
      title: 'Unnatural expression: "was resized bigger"',
      originalText: 'The sports area was resized bigger.',
      suggestedRevision: 'The sports area was expanded.',
      explanation:
        '"Resized bigger" is not a natural English collocation. Use "expanded", "enlarged", or "extended" for this meaning.',
      impactOnScore: 'Reduces Lexical Resource.',
    },
    {
      id: 'issue-t1-06',
      criterionId: 'lexical-resource',
      group: 'must-fix',
      severity: 'medium',
      type: 'wrong-word',
      title: 'Wrong word: "a creation area"',
      originalText: 'a creation area was added near the library.',
      suggestedRevision: 'a recreational area was added near the library.',
      explanation:
        '"Creation area" is not a standard English phrase. The intended word is "recreational area" (an area for leisure activities).',
      impactOnScore: 'Reduces Lexical Resource.',
    },
    {
      id: 'issue-t1-07',
      criterionId: 'lexical-resource',
      group: 'nice-to-improve',
      severity: 'low',
      type: 'word-repetition',
      title: 'Overuse of "built" and "created"',
      originalText: 'A new building was built. A new area was created. More buildings were built.',
      suggestedRevision:
        'A new sports centre was constructed. A recreational area was established. Additional accommodation was developed.',
      explanation:
        'Using the same verbs repeatedly reduces your Lexical Resource score. Vary with "constructed", "established", "developed", "introduced".',
      impactOnScore: 'Minor — reduces Lexical Resource band.',
    },
  ],
  originalAnswer:
    'The two maps show the changes to a university campus between 1990 and 2020.\n\nThere are a lot of new buildings and recreation facilities built during this period. In 1990, there was only one halls of residence building in the north of the campus. The sports area was resized bigger. The car park in the east was removed. Now they were merged as a new car park.\n\nIn addition, a creation area was added near the library in the south. The old science block was demolished and a new one was built in the same place. Overall the campus became more modern.',
  improvedSample:
    'The two maps illustrate the changes that took place on a university campus between 1990 and 2020.\n\nOverall, the campus underwent significant development during this period, with new academic and recreational facilities replacing older structures, while the hall of residence in the north was considerably expanded.\n\nIn 1990, the campus had a single hall of residence in the north, a science block in the centre, a sports area in the west, and a car park in the east. By 2020, the hall of residence had been extended to accommodate more students. The old science block was demolished and replaced by a modern facility in the same location. On the eastern side, the car park was removed and a new recreational area was developed in its place.\n\nIn the south, a library was added alongside the existing sports centre, which was also expanded. These changes suggest a clear shift towards a more academic and student-focused campus environment.',
  recommendedPractice: [
    {
      title: 'Practice writing map overviews',
      description: 'Write one or two overview sentences for three different map pairs. Focus on summarising the overall change rather than listing details.',
      activityType: 'ielts-writing-task-1',
    },
    {
      title: 'Collocation practice for map vocabulary',
      description: 'Learn and practise: was extended, was converted into, was replaced by, was demolished, a recreational area, an accommodation block.',
    },
  ],
  createdAt: new Date().toISOString(),
};
