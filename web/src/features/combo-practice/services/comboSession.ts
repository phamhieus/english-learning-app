import { getExamTopics } from '../../../services/localData';
import { samplePictures } from '../../picture-description/data/sample-images';
import { sampleSentences } from '../../picture-sentence/data/sample-sentences';
import { getRandomTopics } from '../../ielts-speaking/data/ieltsP1Topics';
import { getRandomCueCard } from '../../ielts-speaking/data/part2CueCards';
import { PART3_DISCUSSION_SETS } from '../../ielts-speaking/data/part3DiscussionSets';
import type {
  ComboExam,
  ComboLaunchTarget,
  ComboPartDef,
  ComboPartKey,
  ComboSessionState,
  ComboSkill,
} from '../types/combo-practice.types';

export const COMBO_BUILDER_ROUTE = '/practice-combo';
export const COMBO_RESULT_ROUTE = '/practice-combo/result';

const STORAGE_KEY = 'combo_practice_session';

// ── Part catalog (in official exam order) ────────────────────────────────────

export const COMBO_PARTS: ComboPartDef[] = [
  // TOEIC Speaking — 5 parts, 11 questions
  { key: 'toeic-read', exam: 'TOEIC', skill: 'speaking', label: 'Read Aloud', question: 'Q1–2', description: 'Read a short text aloud with clear pronunciation and intonation.', durationLabel: '45s prep · 45s read', resultRoute: '/speaking/result', defaultSelected: true },
  { key: 'toeic-pic', exam: 'TOEIC', skill: 'speaking', label: 'Describe a Picture', question: 'Q3–4', description: 'Describe everything you see in a photo.', durationLabel: '45s prep · 30s speak', resultRoute: '/speaking/picture/result', defaultSelected: true },
  { key: 'toeic-resp', exam: 'TOEIC', skill: 'speaking', label: 'Respond to Questions', question: 'Q5–7', description: 'Answer three short questions with no preparation time.', durationLabel: '15–30s per answer', resultRoute: '/speaking/respond/result', defaultSelected: true },
  { key: 'toeic-info', exam: 'TOEIC', skill: 'speaking', label: 'Respond Using Info', question: 'Q8–10', description: 'Answer questions using a provided schedule or document.', durationLabel: '45s read · 15–30s answer', resultRoute: '/speaking/respond/result', defaultSelected: true },
  { key: 'toeic-op', exam: 'TOEIC', skill: 'speaking', label: 'Express an Opinion', question: 'Q11', description: 'Give and support your opinion on a familiar topic.', durationLabel: '45s prep · 60s speak', resultRoute: '/speaking/respond/result', defaultSelected: true },
  // IELTS Speaking — 3 parts
  { key: 'ielts-p1', exam: 'IELTS', skill: 'speaking', label: 'Part 1 · Interview', question: '4–5 min', description: 'Short questions about familiar, everyday topics.', durationLabel: '4–5 min', resultRoute: '/speaking/ielts-p1/result', defaultSelected: true },
  { key: 'ielts-p2', exam: 'IELTS', skill: 'speaking', label: 'Part 2 · Long Turn', question: '3–4 min', description: 'Speak from a cue card after one minute of preparation.', durationLabel: '1 min prep · 2 min talk', resultRoute: '/speaking/ielts/result', defaultSelected: true },
  { key: 'ielts-p3', exam: 'IELTS', skill: 'speaking', label: 'Part 3 · Discussion', question: '4–5 min', description: 'Discuss broader, more abstract questions.', durationLabel: '4–5 min', resultRoute: '/speaking/ielts/result', defaultSelected: true },
  // TOEIC Writing — 3 parts, 8 questions
  { key: 'toeic-sent', exam: 'TOEIC', skill: 'writing', label: 'Write a Sentence', question: 'Q1–5', description: 'Write one sentence about a picture using two given words.', durationLabel: '8 mins', resultRoute: '/writing/sentence/result', defaultSelected: true },
  { key: 'toeic-email', exam: 'TOEIC', skill: 'writing', label: 'Respond to a Request', question: 'Q6–7', description: 'Reply to an email request covering all required points.', durationLabel: '10 mins', resultRoute: '/writing/result', defaultSelected: true },
  { key: 'toeic-essay', exam: 'TOEIC', skill: 'writing', label: 'Opinion Essay', question: 'Q8', description: 'Write an opinion essay with reasons and examples.', durationLabel: '30 mins', resultRoute: '/writing/toeic-p3/result', defaultSelected: true },
  // IELTS Writing — 2 tasks (Task 1 in Academic or General flavour)
  { key: 'ielts-t1a', exam: 'IELTS', skill: 'writing', label: 'Task 1 · Academic', question: 'Chart', description: 'Report the key features of a chart, graph or diagram.', durationLabel: '20 mins', resultRoute: '/writing/result', defaultSelected: true },
  { key: 'ielts-t1g', exam: 'IELTS', skill: 'writing', label: 'Task 1 · General', question: 'Letter', description: 'Write a letter for a common everyday situation.', durationLabel: '20 mins', resultRoute: '/writing/result', defaultSelected: false },
  { key: 'ielts-t2', exam: 'IELTS', skill: 'writing', label: 'Task 2 · Essay', question: 'Essay', description: 'Write a 250+ word essay responding to a point of view.', durationLabel: '40 mins', resultRoute: '/writing/result', defaultSelected: true },
];

export const getComboParts = (exam: ComboExam, skill: ComboSkill): ComboPartDef[] =>
  COMBO_PARTS.filter((p) => p.exam === exam && p.skill === skill);

// ── Launch targets ───────────────────────────────────────────────────────────

const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const pickTopic = (exam: ComboExam, skill: 'Speaking' | 'Writing', section: string) => {
  const topics = getExamTopics(exam, skill, section);
  return topics.length > 0
    ? pickRandom(topics)
    : { id: 0, title: 'General Practice', level: 'Medium', type: section, duration: '5 mins' };
};

/**
 * Builds the route + location.state each part's existing session screen
 * expects, picking a random prompt from the same banks the list screens use.
 * Content is frozen at combo start so a reload resumes the same test.
 */
function buildLaunch(key: ComboPartKey): ComboLaunchTarget {
  switch (key) {
    case 'toeic-read':
      return { route: '/speaking/record', state: { practice: pickTopic('TOEIC', 'Speaking', 'Read a Text Aloud'), exam: 'TOEIC', taskKey: 'read', taskLabel: 'Read Aloud' } };
    case 'toeic-pic':
      return { route: '/speaking/picture/practice', state: { practice: pickRandom(samplePictures) } };
    case 'toeic-resp':
      return { route: '/speaking/respond', state: { practice: pickTopic('TOEIC', 'Speaking', 'Respond to Questions'), exam: 'TOEIC', taskKey: 'resp', taskLabel: 'Respond to Questions' } };
    case 'toeic-info':
      return { route: '/speaking/respond', state: { practice: pickTopic('TOEIC', 'Speaking', 'Respond Using Information'), exam: 'TOEIC', taskKey: 'info', taskLabel: 'Respond Using Info' } };
    case 'toeic-op':
      return { route: '/speaking/respond', state: { practice: pickTopic('TOEIC', 'Speaking', 'Express an Opinion'), exam: 'TOEIC', taskKey: 'op', taskLabel: 'Express an Opinion' } };
    case 'ielts-p1':
      return { route: '/speaking/ielts-p1/session', state: { mode: 'full_mock_test', topics: getRandomTopics(2), questionCount: 5, isMockMode: true } };
    case 'ielts-p2':
      return { route: '/speaking/ielts/part-2', state: { cueCardId: getRandomCueCard().id } };
    case 'ielts-p3':
      return {
        route: '/speaking/ielts/part-3',
        state: {
          discussionSetId: pickRandom(PART3_DISCUSSION_SETS).id,
          sessionKey: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
      };
    case 'toeic-sent':
      return { route: '/writing/sentence/practice', state: { practice: pickRandom(sampleSentences) } };
    case 'toeic-email':
      return { route: '/writing/editor', state: { practice: pickTopic('TOEIC', 'Writing', 'Respond to a Written Request'), exam: 'TOEIC', taskKey: 'email', taskLabel: 'Respond to a Request' } };
    case 'toeic-essay':
      return { route: '/writing/toeic-p3/session', state: { practice: pickTopic('TOEIC', 'Writing', 'Write an Opinion Essay') } };
    case 'ielts-t1a':
      return { route: '/writing/editor', state: { practice: pickTopic('IELTS', 'Writing', 'Task 1 Academic'), exam: 'IELTS', taskKey: 't1a', taskLabel: 'Task 1 · Academic' } };
    case 'ielts-t1g':
      return { route: '/writing/editor', state: { practice: pickTopic('IELTS', 'Writing', 'Task 1 General'), exam: 'IELTS', taskKey: 't1g', taskLabel: 'Task 1 · General' } };
    case 'ielts-t2':
      return { route: '/writing/editor', state: { practice: pickTopic('IELTS', 'Writing', 'Task 2 Essay'), exam: 'IELTS', taskKey: 't2', taskLabel: 'Task 2 · Essay' } };
  }
}

// ── Storage ──────────────────────────────────────────────────────────────────

const load = (): ComboSessionState | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ComboSessionState) : null;
  } catch {
    return null;
  }
};

const save = (state: ComboSessionState) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private-mode / quota failures degrade to solo-practice behaviour.
  }
};

// ── Public API ───────────────────────────────────────────────────────────────

export const getComboSession = (): ComboSessionState | null => load();

export const getActiveCombo = (): ComboSessionState | null => {
  const state = load();
  return state?.status === 'active' ? state : null;
};

export const getFinishedCombo = (): ComboSessionState | null => {
  const state = load();
  return state?.status === 'finished' ? state : null;
};

export const cancelCombo = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

/** Starts a new combo and returns the launch target of its first part. */
export function startCombo(exam: ComboExam, skill: ComboSkill, keys: ComboPartKey[]): ComboLaunchTarget {
  const defs = getComboParts(exam, skill).filter((def) => keys.includes(def.key));
  const state: ComboSessionState = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    exam,
    skill,
    status: 'active',
    currentIndex: 0,
    parts: defs.map((def) => ({
      key: def.key,
      label: def.label,
      question: def.question,
      resultRoute: def.resultRoute,
      launch: buildLaunch(def.key),
    })),
    startedAt: new Date().toISOString(),
  };
  save(state);
  return state.parts[0].launch;
}

/** Launch target of the part the active combo is currently waiting on. */
export const resumeCombo = (): ComboLaunchTarget | null => {
  const state = getActiveCombo();
  return state ? state.parts[state.currentIndex]?.launch ?? null : null;
};

export interface ComboStepPayload {
  /** Result route the finishing session would normally navigate to. */
  resultRoute: string;
  /** location.state that result route expects (replayed from the summary). */
  resultState: unknown;
  /** 0–100 score when already evaluated; null for parts scored on their result page. */
  score: number | null;
  title: string;
}

/**
 * Called by a part session instead of navigating to its own result page.
 * Returns where to go next (next part, or the combined result page) when a
 * combo is in progress, or null when the session ran as a solo practice.
 */
export function finishComboStep(payload: ComboStepPayload): ComboLaunchTarget | null {
  const state = getActiveCombo();
  if (!state) return null;

  const part = state.parts[state.currentIndex];
  // A session finishing for a different result route is a solo practice the
  // user wandered into mid-combo — leave the combo untouched.
  if (!part || part.resultRoute !== payload.resultRoute) return null;

  part.outcome = {
    score: payload.score,
    title: payload.title,
    resultState: payload.resultState,
    completedAt: new Date().toISOString(),
  };

  save(advance(state));
  return state.status === 'active'
    ? state.parts[state.currentIndex].launch
    : { route: COMBO_RESULT_ROUTE };
}

/** Moves the combo to its next part, or marks it finished after the last one. */
function advance(state: ComboSessionState): ComboSessionState {
  if (state.currentIndex + 1 < state.parts.length) {
    state.currentIndex += 1;
  } else {
    state.status = 'finished';
    state.finishedAt = new Date().toISOString();
  }
  return state;
}

export interface ComboBackgroundStep {
  /** Result route the finishing session would normally navigate to. */
  resultRoute: string;
  title: string;
  /** Runs the AI evaluation; resolves with the score and the result page's location.state. */
  evaluate: () => Promise<{ score: number | null; resultState: unknown }>;
}

/**
 * Fast variant of finishComboStep for parts whose evaluation is an AI call:
 * advances the combo immediately (so the next part can start with no wait)
 * and scores the finished part in the background, filling its outcome in
 * when the evaluation resolves. Returns null when no combo is in progress —
 * callers then fall back to the solo evaluate-then-navigate flow.
 */
export function runComboStepInBackground(step: ComboBackgroundStep): ComboLaunchTarget | null {
  const state = getActiveCombo();
  if (!state) return null;

  const index = state.currentIndex;
  const part = state.parts[index];
  if (!part || part.resultRoute !== step.resultRoute) return null;

  part.outcome = {
    score: null,
    title: step.title,
    resultState: null,
    completedAt: new Date().toISOString(),
    pending: true,
  };
  save(advance(state));

  const comboId = state.id;
  step
    .evaluate()
    .then(({ score, resultState }) => resolveOutcome(comboId, index, { score, resultState }))
    .catch(() => resolveOutcome(comboId, index, { score: null, resultState: null, error: true }));

  return state.status === 'active'
    ? state.parts[state.currentIndex].launch
    : { route: COMBO_RESULT_ROUTE };
}

/** Writes a background evaluation's result into the stored combo, if it still exists. */
function resolveOutcome(
  comboId: string,
  partIndex: number,
  patch: { score: number | null; resultState: unknown; error?: boolean },
) {
  const state = load();
  // The combo may have been discarded or replaced while scoring ran — drop it.
  if (!state || state.id !== comboId) return;
  const part = state.parts[partIndex];
  if (!part?.outcome) return;
  part.outcome = { ...part.outcome, ...patch, pending: false };
  save(state);
}
