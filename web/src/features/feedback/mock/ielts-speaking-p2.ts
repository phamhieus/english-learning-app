import type { FeedbackResult } from '../types/feedback.types';

export const mockIeltsSpeakingP2: FeedbackResult = {
  id: 'mock-ielts-sp2-001',
  module: 'ielts-speaking',
  overallScore: 5.5,
  scoreLabel: 'Band 5.5',
  teacherComment:
    'You addressed the topic and spoke for close to two minutes, which is a good foundation. However, your answer contains several long pauses while searching for words, and you relied on "I think" and "like" as fillers. Your vocabulary is functional but limited — you tend to use simple words like "good" and "interesting" instead of more precise descriptions. To move from Band 5.5 to 6.0, practise using the Answer → Explain → Example structure to make your points more developed.',
  strengths: [
    'You spoke for approximately 90 seconds, covering the required two-minute slot adequately.',
    'Your pronunciation is mostly clear and understandable throughout.',
    'You addressed all four bullet points on the cue card.',
  ],
  topPriorities: [
    {
      title: 'Reduce long pauses',
      description:
        'You paused for more than 3 seconds on 5 occasions. Use fillers like "Let me think about that for a moment" or "That\'s an interesting question" to maintain fluency while you think.',
      relatedIssueIds: ['issue-sp2-01'],
    },
    {
      title: 'Develop each point with a reason and example',
      description:
        'Use the structure: Point → Explain → Example. Currently your answers state a point and stop. Add "because..." and "For example..."',
      relatedIssueIds: ['issue-sp2-02'],
    },
    {
      title: 'Expand vocabulary beyond basic adjectives',
      description:
        '"Interesting", "good", and "nice" appear 8 times. Replace with more descriptive alternatives.',
      relatedIssueIds: ['issue-sp2-03'],
    },
  ],
  criteria: [
    {
      id: 'fluency-coherence',
      name: 'Fluency & Coherence',
      score: 5.5,
      scoreLabel: 'Band 5.5',
      summary: 'Speaks at reasonable length but noticeable pauses and fillers affect flow.',
      whyThisScore:
        'You maintain speech for a reasonable duration and your ideas are broadly connected. However, 5 pauses over 3 seconds and repeated use of "I think" (7 times) and "like" (9 times) reduce the fluency score.',
      strengths: [
        'Answers cover the full cue card.',
        'Ideas are broadly connected and easy to follow.',
      ],
      issueIds: ['issue-sp2-01', 'issue-sp2-02'],
      nextBandTarget:
        'Keep speaking without stopping even if you\'re unsure. Use discourse markers: "As I was saying", "Moving on to", "What I mean is". Aim for one clear example per point.',
    },
    {
      id: 'lexical-resource-sp',
      name: 'Lexical Resource',
      score: 5.0,
      scoreLabel: 'Band 5',
      summary: 'Vocabulary is adequate but basic, with frequent repetition.',
      whyThisScore:
        '"Interesting", "good", and "nice" account for 8 of your descriptive adjectives. You attempt very few topic-specific words and rely on simple, common phrases throughout.',
      strengths: [
        'Topic-related words are used in context ("exhibition", "local museum").',
        'No significant confusion caused by vocabulary choice.',
      ],
      issueIds: ['issue-sp2-03'],
      nextBandTarget:
        'Build a vocabulary bank for IELTS speaking topics. For describing places: "captivating", "thought-provoking", "vibrant". For describing feelings: "moved", "inspired", "nostalgic".',
    },
    {
      id: 'grammar-sp',
      name: 'Grammatical Range & Accuracy',
      score: 5.5,
      scoreLabel: 'Band 5.5',
      summary: 'Mostly accurate simple and compound sentences; limited complex structures.',
      whyThisScore:
        'Grammar is generally accurate at the sentence level, but you mostly use simple structures. Attempts at complex sentences occasionally contain errors.',
      strengths: [
        'Subject-verb agreement is mostly correct.',
        'Past tense narration is used accurately.',
      ],
      issueIds: ['issue-sp2-04'],
      nextBandTarget:
        'Use relative clauses ("which I found really captivating"), conditional sentences ("If I hadn\'t gone, I would have missed..."), and participle phrases to add grammatical variety.',
    },
    {
      id: 'pronunciation-sp',
      name: 'Pronunciation',
      score: 6.0,
      scoreLabel: 'Band 6',
      summary: 'Generally clear with some inconsistency in word stress.',
      whyThisScore:
        'Most of your speech is intelligible and you are easy to understand. However, word stress is occasionally misplaced, and final consonant sounds are sometimes dropped.',
      strengths: [
        'Overall intelligibility is good.',
        'Intonation varies naturally in most sentences.',
      ],
      issueIds: ['issue-sp2-05'],
      nextBandTarget:
        'Focus on word stress for multi-syllable words. Practise final consonant sounds (/t/, /d/, /s/, /z/) — these are often dropped, especially before the next word begins with a consonant.',
    },
  ],
  issues: [
    {
      id: 'issue-sp2-01',
      criterionId: 'fluency-coherence',
      group: 'must-fix',
      severity: 'high',
      type: 'long-pause',
      title: '5 pauses longer than 3 seconds detected',
      explanation:
        'Long silent pauses significantly reduce fluency. Instead of going silent, use natural fillers to maintain flow: "Let me think...", "That\'s a good question actually...", "How can I put this..."',
      impactOnScore: 'Directly reduces Fluency & Coherence score.',
    },
    {
      id: 'issue-sp2-02',
      criterionId: 'fluency-coherence',
      group: 'must-fix',
      severity: 'medium',
      type: 'underdeveloped-points',
      title: 'Points are stated but not explained or exemplified',
      originalText: 'I visited the National Museum last month. It was very interesting.',
      suggestedRevision:
        'I visited the National Museum last month, which I found genuinely captivating. What impressed me most was an exhibition about ancient Vietnamese dynasties — seeing the original artefacts up close made history feel very real to me.',
      explanation:
        'After stating your point ("interesting"), explain why and give a specific example. This shows fluency and coherence — the examiner can see your ideas connecting.',
      impactOnScore: 'Reduces Fluency & Coherence and Lexical Resource.',
    },
    {
      id: 'issue-sp2-03',
      criterionId: 'lexical-resource-sp',
      group: 'must-fix',
      severity: 'medium',
      type: 'limited-adjectives',
      title: '"Interesting", "good", "nice" used 8 times',
      originalText: 'It was very interesting. The museum is very nice. I think it was a good experience.',
      suggestedRevision:
        '"It was genuinely captivating." / "The museum is beautifully designed." / "It was an unforgettable experience."',
      explanation:
        'Basic adjectives signal limited vocabulary range. Even replacing them with slightly less common alternatives significantly improves your Lexical Resource score.',
      impactOnScore: 'Reduces Lexical Resource.',
    },
    {
      id: 'issue-sp2-04',
      criterionId: 'grammar-sp',
      group: 'nice-to-improve',
      severity: 'medium',
      type: 'limited-complex-structures',
      title: 'Very few complex sentence structures used',
      originalText: 'I went there. I saw many things. I liked it very much.',
      suggestedRevision:
        'When I visited, I was struck by the sheer variety of exhibits, which ranged from prehistoric artefacts to modern art installations.',
      explanation:
        'Using relative clauses, participle phrases, and subordinate clauses shows a wider grammatical range and moves you from Band 5.5 to 6+.',
      impactOnScore: 'Improves Grammatical Range.',
    },
    {
      id: 'issue-sp2-05',
      criterionId: 'pronunciation-sp',
      group: 'nice-to-improve',
      severity: 'low',
      type: 'final-consonant-dropping',
      title: 'Final consonant sounds occasionally dropped',
      originalText: '"worked" → /wɜːk/ (missing final /t/), "students" → /stjuːdən/ (missing /s/)',
      suggestedRevision:
        'Practise saying the final sound clearly: "work-T", "student-S". Slow down slightly at the end of each word.',
      explanation:
        'Dropping final consonants is common for Vietnamese speakers of English. It slightly reduces clarity, particularly before words beginning with consonants.',
      impactOnScore: 'Minor reduction to Pronunciation score.',
    },
  ],
  transcript:
    'Um... I want to talk about a place I visited last month. I went to the National Museum in the city. I went with my friend because... um... we wanted to learn about history. The museum is very nice and interesting. There are many things to see inside. I think the exhibition about... um... the ancient period was very good. I like history so... um... it was interesting. The museum has a nice cafe too. I would like to go again because it is good for learning. I think everyone should visit a museum because... um... it is important to know about culture. Um... I stayed for about two hours and I saw many interesting things.',
  recommendedPractice: [
    {
      title: 'Practise the Answer → Explain → Example structure',
      description: 'Choose a cue card and record yourself. Check that each point has: a statement, an explanation ("because..."), and a specific example. Aim for 2 minutes.',
      activityType: 'ielts-speaking',
    },
    {
      title: 'Vocabulary builder: describing experiences',
      description: 'Learn 10 adjectives to replace "interesting" and "good": captivating, thought-provoking, inspiring, unforgettable, breathtaking, vibrant, immersive, enriching, stimulating, moving.',
    },
  ],
  audioAnalysis: {
    durationSeconds: 92,
    speakingRateWpm: 98,
    longPauseCount: 5,
    fillerWords: { 'um': 7, 'like': 9, 'I think': 7 },
    mispronouncedWords: [
      {
        word: 'worked',
        detectedProblem: 'Final /t/ sound dropped',
        suggestedPractice: 'Practise "work-T" in isolation, then in the phrase "I worked there"',
      },
      {
        word: 'students',
        detectedProblem: 'Final /s/ sound unclear',
        suggestedPractice: 'Practise ending words with a clear /s/ sound: "students", "events", "moments"',
      },
    ],
    rhythmComment: 'Speaking rate is slightly slow at 98 wpm. Aim for 120–140 wpm for natural conversational speech.',
    intonationComment: 'Intonation is mostly natural but flattens towards the end of longer sentences.',
  },
  createdAt: new Date().toISOString(),
};
