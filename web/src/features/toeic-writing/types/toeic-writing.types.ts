// Types for the TOEIC Writing Part 3 (Opinion Essay / Question 8) module.

/**
 * The four common prompt patterns ETS uses for the Q8 opinion essay.
 * Derived from the prompt wording by `classifyQuestionType`.
 */
export type EssayQuestionType =
  | 'agree-disagree'
  | 'advantages-disadvantages'
  | 'preference'
  | 'general-opinion';

/**
 * Subject themes used to group the Q8 opinion-essay prompts so learners can
 * pick a topic area to practise. Inferred from the prompt wording by
 * `classifyTheme` (the prompt bank only carries one coarse topicGroup).
 */
export type EssayTheme =
  | 'workplace'
  | 'business-consumer'
  | 'technology'
  | 'education-career'
  | 'money'
  | 'city-environment';

/** Where the writer stands on the statement — drives the planning panel. */
export type EssayStance = 'agree' | 'disagree' | 'undecided';

/** A single "reason + supporting example" pair from the planning panel. */
export interface EssayReason {
  id: string;
  reason: string;
  example: string;
}

/** The learner's pre-writing plan, kept visible as a reference while writing. */
export interface EssayOutline {
  stance: EssayStance;
  reasons: EssayReason[];
  notes: string;
}

/** One item in the live writing checklist. */
export interface EssayChecklistItem {
  label: string;
  done: boolean;
}
