export const ErrorCategory = {
  CONCEPTUAL: 'conceptual',
  PROCEDURAL: 'procedural',
  CARELESS: 'careless',
  MISREAD: 'misread',
  STRATEGY: 'strategy',
  MEMORY: 'memory',
} as const;

export type ErrorCategoryType = (typeof ErrorCategory)[keyof typeof ErrorCategory];

export interface LearnerSkillState {
  userId: string;
  skillId: string;
  theta: number; // ability on logit scale (-3 to +3, starts at 0.0)
  attemptsCount: number;
  tier: number; // 0 to 5
  strength: number; // 0 to 1
  brierScoreSum: number;
  calibrationCount: number;
  lastSeen?: string;
  firstSolidAt?: string;
  lastRetentionCheckAt?: string;
  errorProfile: Record<ErrorCategoryType | string, number>;
}

export interface LearnerProfile {
  userId: string;
  domainShares: Record<string, number>;
  interestWeights: Record<string, number>;
  streakCurrent: number;
  streakMax: number;
  lastSessionDate?: string;
  boredomScore: number;
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function logit(p: number): number {
  const clamped = Math.max(0.0001, Math.min(0.9999, p));
  return Math.log(clamped / (1 - clamped));
}

export function calculateExpectedScore(theta: number, b: number): number {
  return sigmoid(theta - b);
}

export function calculateKFactor(attempts: number): number {
  return Math.max(0.05, 0.4 / Math.sqrt(1 + attempts / 10));
}

export function calculateAttemptScore(correct: boolean, hintsUsed: number, durationMs?: number, medianDurationMs?: number): number {
  if (!correct) return 0;
  let score = 1.0 - 0.25 * Math.min(hintsUsed, 4);
  if (medianDurationMs && durationMs && durationMs > 2.5 * medianDurationMs) {
    score = Math.min(score, 0.85); // slow but correct cap
  }
  return Math.max(0, score);
}

export function updateTheta(currentTheta: number, itemDifficulty: number, score: number, attempts: number): number {
  const p = calculateExpectedScore(currentTheta, itemDifficulty);
  const K = calculateKFactor(attempts);
  const nextTheta = currentTheta + K * (score - p);
  // Keep bounded within reasonable logit scale
  return Math.max(-4.0, Math.min(4.0, nextTheta));
}

export function targetDifficultyForSkill(theta: number): number {
  // b* = theta - 1.1 gives ~75% expected success rate
  return theta - 1.1;
}
