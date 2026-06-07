// Runs an ordered list of prosody rules over a plan. Kept as its own module so
// the rule set can be swapped or extended (e.g. an AI rule in Phase 3) without
// touching the planner.

import { RULE_PIPELINE, type ProsodyRule } from './rules';
import type { SpeechPlan, SpeechRequest } from './types';

export class ProsodyRuleEngine {
  private readonly rules: ProsodyRule[];

  constructor(rules: ProsodyRule[] = RULE_PIPELINE) {
    this.rules = rules;
  }

  run(plan: SpeechPlan, request: SpeechRequest): SpeechPlan {
    return this.rules.reduce((current, rule) => rule.apply(current, request), plan);
  }

  get ruleNames(): string[] {
    return this.rules.map((r) => r.name);
  }
}
