import type { IeltsP2AnswerInput, IeltsP3AnswerInput } from '../types/ielts-speaking.types';

export const IELTS_PRACTICE_DISCLAIMER =
  'This is an AI-generated estimate for practice purposes. It is not an official IELTS score.';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countMatches(text: string, patterns: RegExp[]): number {
  const normalized = text.toLowerCase();
  return patterns.reduce((total, pattern) => total + (normalized.match(pattern)?.length ?? 0), 0);
}

function hasEnoughSpeech(transcript: string, durationSeconds: number, minWords = 8): boolean {
  return countWords(transcript) >= minWords && durationSeconds >= 5;
}

function roundBand(value: number): number {
  return Math.round(Math.max(3.5, Math.min(value, 8.5)) * 2) / 2;
}

function strictBand(value: number, penalty = 0.5): number {
  return roundBand(value - penalty);
}

function wordsPerMinute(words: number, durationSeconds: number): number {
  return durationSeconds > 0 ? Math.round(words / (durationSeconds / 60)) : 0;
}

function durationBand(durationSeconds: number, idealMin: number, idealMax: number): number {
  if (durationSeconds >= idealMin * 1.4 && durationSeconds <= idealMax) return 8;
  if (durationSeconds >= idealMin && durationSeconds <= idealMax + 10) return 7;
  if (durationSeconds >= idealMin * 0.75 && durationSeconds <= idealMax + 30) return 6;
  if (durationSeconds >= idealMin * 0.5) return 5;
  return 4.5;
}

function paceBand(wpm: number): number {
  if (wpm >= 110 && wpm <= 155) return 8;
  if (wpm >= 90 && wpm <= 175) return 7;
  if (wpm >= 70 && wpm <= 195) return 6;
  if (wpm >= 50 && wpm <= 215) return 5;
  return 4.5;
}

function evidenceBand(count: number, good: number, okay: number): number {
  if (count >= good) return 8;
  if (count >= okay) return 7;
  if (count > 0) return 6;
  return 5;
}

function criterion(label: string, estimatedBand: number | null, tip: string, issues: string[] = []) {
  return {
    estimatedBand,
    strengths: estimatedBand == null ? [] : [`${label} shows enough spoken evidence for a practice estimate.`],
    issues: estimatedBand == null ? ['Not enough spoken evidence to estimate this criterion.'] : issues,
    improvementTip: tip,
  };
}

function averageBand(values: Array<number | null>): number | null {
  if (values.length === 0) return null;
  if (values.some((value) => value == null)) return null;
  const total = values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  return Math.round((total / values.length) * 2) / 2;
}

function examinerCapBand(value: number, maxBand: number, penalty = 0): number {
  return roundBand(Math.min(value - penalty, maxBand));
}

const TRANSITION_PATTERNS = [
  /\bfirst(ly)?\b/g,
  /\bsecond(ly)?\b/g,
  /\banother\b/g,
  /\boverall\b/g,
  /\bin the end\b/g,
  /\bas a result\b/g,
  /\bfor example\b/g,
  /\bfor instance\b/g,
];

const EXAMPLE_PATTERNS = [
  /\bfor example\b/g,
  /\bfor instance\b/g,
  /\bone time\b/g,
  /\bi remember\b/g,
  /\bwhen i\b/g,
  /\bsuch as\b/g,
];

const PART3_REASONING_PATTERNS = [
  /\bbecause\b/g,
  /\btherefore\b/g,
  /\bas a result\b/g,
  /\bthis means\b/g,
  /\bone reason\b/g,
  /\bthe main reason\b/g,
  /\bit depends\b/g,
];

const PART3_ABSTRACT_PATTERNS = [
  /\bsociety\b/g,
  /\bcommunity\b/g,
  /\beconomy\b/g,
  /\beducation\b/g,
  /\btechnology\b/g,
  /\bgovernment\b/g,
  /\bculture\b/g,
  /\bgeneration\b/g,
  /\bin general\b/g,
  /\bpeople tend to\b/g,
];

const PART3_BALANCE_PATTERNS = [
  /\bon the other hand\b/g,
  /\bhowever\b/g,
  /\bwhereas\b/g,
  /\bwhile\b/g,
  /\bcompared with\b/g,
  /\bin contrast\b/g,
  /\balthough\b/g,
];

function scorePart2LongTurn(answer: IeltsP2AnswerInput) {
  const words = countWords(answer.transcript);
  if (!hasEnoughSpeech(answer.transcript, answer.durationSeconds, 45)) {
    return {
      words,
      wpm: wordsPerMinute(words, answer.durationSeconds),
      transitions: 0,
      examples: 0,
      criteria: null,
      detectedIssues: ['Not enough long-turn speech detected for a reliable Part 2 practice estimate.'],
    };
  }

  const wpm = wordsPerMinute(words, answer.durationSeconds);
  const transitions = countMatches(answer.transcript, TRANSITION_PATTERNS);
  const examples = countMatches(answer.transcript, EXAMPLE_PATTERNS);
  const durationScore = durationBand(answer.durationSeconds, 60, 120);
  const wordScore = words >= 230 ? 8 : words >= 180 ? 7 : words >= 135 ? 6 : words >= 90 ? 5 : 4.5;
  const lexicalDepthScore = words >= 260 ? 8 : words >= 210 ? 7 : words >= 160 ? 6 : words >= 110 ? 5 : 4.5;
  const transitionScore = evidenceBand(transitions, 4, 2);
  const exampleScore = evidenceBand(examples, 2, 1);

  const fluencyCoherence = strictBand((durationScore + paceBand(wpm) + transitionScore) / 3);
  const lexicalResource = strictBand((wordScore + lexicalDepthScore) / 2);
  const grammaticalRangeAccuracy = strictBand((wordScore + transitionScore + exampleScore) / 3);
  const pronunciation = strictBand((paceBand(wpm) + durationScore) / 2, 0.25);

  const detectedIssues = [
    answer.durationSeconds < 60 ? 'Long turn is shorter than the recommended 60 seconds.' : '',
    words < 180 ? 'Long turn needs more development to reach a higher band estimate.' : '',
    transitions < 2 ? 'Add clearer signposting to organize the long turn.' : '',
    examples < 1 ? 'Add at least one concrete example or memory.' : '',
  ].filter(Boolean);

  return {
    words,
    wpm,
    transitions,
    examples,
    criteria: { fluencyCoherence, lexicalResource, grammaticalRangeAccuracy, pronunciation },
    detectedIssues,
  };
}

function scoreShortAnswer(answer: IeltsP2AnswerInput | IeltsP3AnswerInput, targetWords: number): number | null {
  const words = countWords(answer.transcript);
  if (!hasEnoughSpeech(answer.transcript, answer.durationSeconds, 12) || answer.durationSeconds < 8) return null;
  const wordScore = words >= targetWords * 1.4 ? 8 : words >= targetWords ? 7 : words >= targetWords * 0.75 ? 6 : words >= targetWords * 0.5 ? 5 : 4.5;
  return strictBand((wordScore + paceBand(wordsPerMinute(words, answer.durationSeconds))) / 2, 0.25);
}

function scorePart3Answers(answers: IeltsP3AnswerInput[]) {
  const valid = answers.filter((answer) => hasEnoughSpeech(answer.transcript, answer.durationSeconds, 18) && answer.durationSeconds >= 10);
  if (valid.length === 0) return null;

  const transcript = valid.map((answer) => answer.transcript).join(' ');
  const words = countWords(transcript);
  const totalDuration = valid.reduce((sum, answer) => sum + answer.durationSeconds, 0);
  const wpm = wordsPerMinute(words, totalDuration);
  const reasoning = countMatches(transcript, PART3_REASONING_PATTERNS);
  const abstractLanguage = countMatches(transcript, PART3_ABSTRACT_PATTERNS);
  const balance = countMatches(transcript, PART3_BALANCE_PATTERNS);
  const examples = countMatches(transcript, EXAMPLE_PATTERNS);
  const averageWords = words / valid.length;
  const completionRatio = answers.length > 0 ? valid.length / answers.length : 0;
  const completionScore = completionRatio >= 0.9 ? 8 : completionRatio >= 0.7 ? 7 : completionRatio >= 0.5 ? 6 : 5;

  const developmentScore = averageWords >= 95 ? 8 : averageWords >= 75 ? 7 : averageWords >= 55 ? 6 : averageWords >= 35 ? 5 : 4.5;
  const reasoningScore = evidenceBand(reasoning, 7, 3);
  const abstractionScore = evidenceBand(abstractLanguage, 5, 2);
  const balanceScore = evidenceBand(balance, 3, 1);
  const exampleScore = evidenceBand(examples, 4, 2);

  return {
    words,
    wpm,
    reasoning,
    abstractLanguage,
    balance,
    examples,
    averageWords,
    completionRatio,
    criteria: {
      fluencyCoherence: strictBand((developmentScore + reasoningScore + paceBand(wpm) + completionScore) / 4),
      lexicalResource: strictBand((abstractionScore + developmentScore) / 2),
      grammaticalRangeAccuracy: strictBand((reasoningScore + balanceScore + developmentScore) / 3),
      pronunciation: strictBand((paceBand(wpm) + developmentScore + completionScore) / 3, 0.25),
    },
    detectedIssues: [
      completionRatio < 0.9 ? 'Some Part 3 answers were too short to count as developed responses.' : '',
      averageWords < 60 ? 'Several Part 3 answers are too short for discussion-style development.' : '',
      reasoning < 3 ? 'Add more reasons, effects, or explanations.' : '',
      balance < 1 ? 'Add comparison or an alternative perspective in at least one answer.' : '',
      abstractLanguage < 2 ? 'Use broader social or abstract vocabulary, not only personal examples.' : '',
    ].filter(Boolean),
  };
}

export function evaluatePart2Practice(input: {
  cueCardTitle: string;
  durationSeconds: number;
  longTurn: IeltsP2AnswerInput;
  roundingOff: IeltsP2AnswerInput[];
}) {
  const longTurnScore = scorePart2LongTurn(input.longTurn);
  const longCriteria = longTurnScore.criteria;
  const followUpBands = input.roundingOff.map((answer) => scoreShortAnswer(answer, 45));
  const followUpBand = followUpBands.length > 0 ? averageBand(followUpBands.filter((band) => band != null)) : null;
  const rawCriteria = longCriteria
    ? {
        fluencyCoherence: followUpBand == null ? longCriteria.fluencyCoherence : roundBand(longCriteria.fluencyCoherence * 0.85 + followUpBand * 0.15),
        lexicalResource: followUpBand == null ? longCriteria.lexicalResource : roundBand(longCriteria.lexicalResource * 0.85 + followUpBand * 0.15),
        grammaticalRangeAccuracy: followUpBand == null ? longCriteria.grammaticalRangeAccuracy : roundBand(longCriteria.grammaticalRangeAccuracy * 0.85 + followUpBand * 0.15),
        pronunciation: followUpBand == null ? longCriteria.pronunciation : roundBand(longCriteria.pronunciation * 0.85 + followUpBand * 0.15),
      }
    : null;
  const longTurnCap = (() => {
    if (!longCriteria) return 0;
    if (input.longTurn.durationSeconds < 60 || longTurnScore.words < 110) return 5.5;
    if (input.longTurn.durationSeconds < 80 || longTurnScore.words < 150) return 6;
    if (input.longTurn.durationSeconds < 95 || longTurnScore.words < 180 || longTurnScore.transitions < 2) return 6.5;
    if (longTurnScore.examples < 1 || longTurnScore.transitions < 3) return 7;
    return 8.5;
  })();
  const examinerPenalty = input.longTurn.durationSeconds < 100 || longTurnScore.words < 200 || longTurnScore.transitions < 3 ? 0.5 : 0;
  const criteria = rawCriteria
    ? {
        fluencyCoherence: examinerCapBand(rawCriteria.fluencyCoherence, longTurnCap, examinerPenalty),
        lexicalResource: examinerCapBand(rawCriteria.lexicalResource, longTurnCap, examinerPenalty),
        grammaticalRangeAccuracy: examinerCapBand(rawCriteria.grammaticalRangeAccuracy, longTurnCap, examinerPenalty),
        pronunciation: examinerCapBand(rawCriteria.pronunciation, Math.min(8.5, longTurnCap + 0.5), examinerPenalty > 0 ? 0.25 : 0),
      }
    : null;
  const estimatedBand = criteria ? averageBand(Object.values(criteria)) : null;

  return {
    sessionTitle: 'IELTS Speaking Part 2 - Long Turn',
    mode: 'part_2_practice',
    durationSeconds: input.durationSeconds,
    cueCardTitle: input.cueCardTitle,
    estimatedBand,
    disclaimer: IELTS_PRACTICE_DISCLAIMER,
    criteria: {
      fluencyCoherence: criterion(
        'Fluency and Coherence',
        criteria?.fluencyCoherence ?? null,
        'Use a clear beginning, middle, and final reflection.',
        longTurnScore.transitions < 1 ? ['The long turn needs clearer signposting.'] : [],
      ),
      lexicalResource: criterion(
        'Lexical Resource',
        criteria?.lexicalResource ?? null,
        'Add topic-specific vocabulary from your notes.',
        longTurnScore.words < 120 ? ['Vocabulary range is limited because the long turn is short.'] : [],
      ),
      grammaticalRangeAccuracy: criterion(
        'Grammatical Range and Accuracy',
        criteria?.grammaticalRangeAccuracy ?? null,
        'Use relative clauses, time clauses, and contrast structures while staying accurate.',
        longTurnScore.examples < 1 ? ['Add one developed example to create more complex sentence opportunities.'] : [],
      ),
      pronunciation: criterion(
        'Pronunciation',
        criteria?.pronunciation ?? null,
        'Keep a steady pace and mark key words with stress.',
        longTurnScore.wpm > 190 || (longTurnScore.wpm > 0 && longTurnScore.wpm < 75) ? [`Your estimated pace is ${longTurnScore.wpm} WPM.`] : [],
      ),
    },
    coachingInsights: [
      { key: 'duration', label: 'Speaking duration', message: `${input.longTurn.durationSeconds}s long turn. Aim for 60-120s.` },
      { key: 'pace', label: 'Speaking pace', message: longTurnScore.wpm ? `${longTurnScore.wpm} WPM estimated. Natural IELTS practice range is roughly 95-165 WPM.` : 'Not enough speech to estimate pace.' },
      { key: 'coverage', label: 'Cue-card coverage', message: `${longTurnScore.words} words detected. A fuller Part 2 answer usually needs a clear story plus all cue-card points.` },
      { key: 'examples', label: 'Examples', message: longTurnScore.examples > 0 ? `${longTurnScore.examples} example marker(s) detected.` : 'Add one concrete personal example.' },
      { key: 'transitions', label: 'Transitions', message: longTurnScore.transitions > 0 ? `${longTurnScore.transitions} transition marker(s) detected.` : 'Use signposts such as "first", "another thing", and "overall".' },
      { key: 'examiner_calibration', label: 'Examiner calibration', message: criteria ? `Higher bands are capped at ${longTurnCap.toFixed(1)} unless the long turn has enough length, development, signposting, and examples.` : 'No band is estimated until the long turn has enough speech evidence.' },
    ],
    longTurnResult: {
      transcript: input.longTurn.transcript,
      durationSeconds: input.longTurn.durationSeconds,
      quickScore: estimatedBand,
      correctedTranscript: input.longTurn.transcript,
      improvedAnswer: 'Build a two-minute answer with context, key details, a short example, and a final reason why it matters.',
      detectedIssues: longTurnScore.detectedIssues,
    },
    roundingOffResults: input.roundingOff.map((answer) => ({
      questionId: answer.questionId,
      question: answer.question,
      transcript: answer.transcript,
      durationSeconds: answer.durationSeconds,
      quickScore: scoreShortAnswer(answer, 45),
      correctedTranscript: answer.transcript,
      improvedAnswer: 'Answer directly, then add one reason or example.',
    })),
    keyStrengths: estimatedBand == null ? [] : ['You completed the long-turn structure and follow-up questions.'],
    priorityImprovements: ['Cover every cue-card bullet clearly.', 'Develop one example instead of listing ideas.'],
  };
}

export function evaluatePart3Practice(input: {
  theme: string;
  durationSeconds: number;
  answers: IeltsP3AnswerInput[];
}) {
  const part3Score = scorePart3Answers(input.answers);
  const questionResults = input.answers.map((answer) => {
    const quickScore = scoreShortAnswer(answer, 70);
    return {
      questionId: answer.questionId,
      question: answer.question,
      transcript: answer.transcript,
      durationSeconds: answer.durationSeconds,
      quickScore,
      correctedTranscript: answer.transcript,
      improvedAnswer: 'Give a direct opinion, explain why, then widen the answer with an example, contrast, or prediction.',
      detectedIssues: quickScore == null ? ['Not enough speech detected for this answer.'] : [],
    };
  });
  const part3Cap = (() => {
    if (!part3Score) return 0;
    if (part3Score.completionRatio < 0.7 || part3Score.averageWords < 45) return 5.5;
    if (part3Score.averageWords < 65 || part3Score.reasoning < 3) return 6;
    if (part3Score.averageWords < 80 || part3Score.reasoning < 5 || part3Score.abstractLanguage < 2) return 6.5;
    if (part3Score.balance < 2 || part3Score.examples < 2) return 7;
    return 8.5;
  })();
  const part3Penalty = part3Score && (part3Score.averageWords < 85 || part3Score.reasoning < 5 || part3Score.abstractLanguage < 3) ? 0.5 : 0;
  const calibratedPart3Criteria = part3Score
    ? {
        fluencyCoherence: examinerCapBand(part3Score.criteria.fluencyCoherence, part3Cap, part3Penalty),
        lexicalResource: examinerCapBand(part3Score.criteria.lexicalResource, part3Cap, part3Penalty),
        grammaticalRangeAccuracy: examinerCapBand(part3Score.criteria.grammaticalRangeAccuracy, part3Cap, part3Penalty),
        pronunciation: examinerCapBand(part3Score.criteria.pronunciation, Math.min(8.5, part3Cap + 0.5), part3Penalty > 0 ? 0.25 : 0),
      }
    : null;
  const estimatedBand = calibratedPart3Criteria ? averageBand(Object.values(calibratedPart3Criteria)) : null;

  return {
    sessionTitle: 'IELTS Speaking Part 3 - Discussion',
    mode: 'part_3_practice',
    durationSeconds: input.durationSeconds,
    discussionTheme: input.theme,
    estimatedBand,
    disclaimer: IELTS_PRACTICE_DISCLAIMER,
    criteria: {
      fluencyCoherence: criterion(
        'Fluency and Coherence',
        calibratedPart3Criteria?.fluencyCoherence ?? null,
        'Link ideas with reasons, contrasts, and consequences.',
        part3Score?.reasoning && part3Score.reasoning < 2 ? ['Answers need clearer reasoning links.'] : [],
      ),
      lexicalResource: criterion(
        'Lexical Resource',
        calibratedPart3Criteria?.lexicalResource ?? null,
        'Use abstract vocabulary, not only personal examples.',
        part3Score?.abstractLanguage === 0 ? ['Use more general social or abstract vocabulary.'] : [],
      ),
      grammaticalRangeAccuracy: criterion(
        'Grammatical Range and Accuracy',
        calibratedPart3Criteria?.grammaticalRangeAccuracy ?? null,
        'Use conditionals, comparison, cause-effect, and contrast structures when useful.',
        part3Score?.balance === 0 ? ['Add contrast or comparison structures.'] : [],
      ),
      pronunciation: criterion(
        'Pronunciation',
        calibratedPart3Criteria?.pronunciation ?? null,
        'Pause between ideas instead of inside short phrases.',
        part3Score && (part3Score.wpm > 190 || part3Score.wpm < 75) ? [`Your estimated pace is ${part3Score.wpm} WPM.`] : [],
      ),
    },
    coachingInsights: [
      { key: 'direct_answer', label: 'Direct answer', message: 'Start each answer with a clear position, then expand.' },
      { key: 'reasoning_depth', label: 'Reasoning depth', message: part3Score ? `${part3Score.reasoning} reasoning marker(s) detected across the discussion.` : 'Not enough speech to estimate reasoning depth.' },
      { key: 'abstract_language', label: 'Abstract language', message: part3Score ? `${part3Score.abstractLanguage} abstract/social vocabulary marker(s) detected.` : 'Use broader language beyond personal stories.' },
      { key: 'comparison', label: 'Comparison', message: part3Score ? `${part3Score.balance} contrast or comparison marker(s) detected.` : 'Add an alternative perspective.' },
      { key: 'examples', label: 'Examples', message: part3Score ? `${part3Score.examples} example marker(s) detected.` : 'Support views with examples.' },
      { key: 'examiner_calibration', label: 'Examiner calibration', message: part3Score ? `Higher bands are capped at ${part3Cap.toFixed(1)} unless answers are developed, abstract, reasoned, and balanced.` : 'No band is estimated until enough developed Part 3 answers are detected.' },
    ],
    questionResults,
    keyStrengths: estimatedBand == null ? [] : ['You responded to broader discussion questions.'],
    priorityImprovements: ['Extend answers with examples and comparisons.', 'Avoid staying only at personal story level.'],
  };
}
