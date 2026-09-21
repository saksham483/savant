import { z } from 'zod';
import { DomainIdSchema } from './domain.js';

export const ItemFormatSchema = z.enum([
  'computational',
  'proof_scaffold',
  'spot_the_error',
  'counterexample',
  'interactive_sandbox',
  'fermi',
  'explain_back',
  'write_code',
  'bug_hunt',
  'trace_predict',
  'complexity_analysis',
  'parsons_code',
  'photo_id',
  'anatomy_label',
  'dichotomous_key',
  'sky_navigation',
  'orbital_sim',
  'light_curve_analysis',
  'timeline_order',
  'primary_source',
  'causal_chain',
  'experiment_predict',
  'find_confound',
  'perspective_forge',
  'boss_challenge',
  'wild_card'
]);
export type ItemFormat = z.infer<typeof ItemFormatSchema>;

export const ItemProvenanceSchema = z.enum([
  'generator',
  'llm_verified',
  'curated',
  'human_reviewed'
]);
export type ItemProvenance = z.infer<typeof ItemProvenanceSchema>;

export const ItemStatusSchema = z.enum([
  'active',
  'quarantined',
  'retired'
]);
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

export interface AnswerKey {
  type: 'exact' | 'numeric' | 'set-of-numbers' | 'latex' | 'ordered-sequence' | 'code-tests' | 'rubric' | 'multiple-choice';
  value: any;
  tolerance?: number; // for numeric answers
  testCases?: Array<{
    name: string;
    input: any;
    expected: any;
    hidden?: boolean;
  }>;
  rubricCriteria?: string[];
}

export interface Item {
  id: string;
  skillId: string;
  familyId: string;
  domain: z.infer<typeof DomainIdSchema>;
  format: ItemFormat;
  difficulty: number; // logit scale b, approx -3 to +3
  seed?: number;
  prompt: string;
  latexPrompt?: string;
  scaffoldData?: any; // e.g. steps to order, code template, diagram payload
  answerKey: AnswerKey;
  solution: string;
  errorPatterns?: Array<{
    tag: string;
    matcher?: string;
    explanation: string;
  }>;
  hints?: string[]; // L0, L1, L2, L3, L4
  provenance: ItemProvenance;
  verifiedBy: string[]; // e.g. ['sympy'], ['pyodide-tests'], ['curated-store']
  status: ItemStatus;
  flags?: number;
  createdAt: string;
}

export interface GradeResult {
  score: number; // 0 to 1
  correct: boolean;
  confidence: 'verified' | 'rubric' | 'llm';
  errorTags: string[];
  namedMisconception?: string;
  notes?: string;
  feedback?: string;
  expertNotice?: string;
}

export interface UserAttempt {
  id: string;
  userId: string;
  itemId: string;
  skillId: string;
  sessionId?: string;
  blockId?: string;
  startedAt: string;
  durationMs: number;
  response: any;
  score: number;
  correct: boolean;
  hintsUsed: number;
  confidence?: number; // 1 to 5
  errorTags: string[];
  gradeConfidence: 'verified' | 'rubric' | 'llm';
}
