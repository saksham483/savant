export const SRSRating = {
  AGAIN: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4
} as const;

export type SRSRatingValue = (typeof SRSRating)[keyof typeof SRSRating];

export interface SRSCard {
  id: string;
  userId: string;
  skillId: string;
  familyId?: string;
  factId?: string;
  due: string; // ISO date
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
  lastReview?: string;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  rating: SRSRatingValue;
  reviewedAt: string;
  elapsedDays: number;
  scheduledDays: number;
  stateBefore: string;
}

/**
 * Calculates current retrievability R(t) = (1 + factor * t / S)^(-decay)
 * simplified or standard FSRS power law approximation
 */
export function calculateRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  const factor = 19 / 81; // FSRS standard factor for 0.9 desired retention
  return Math.pow(1 + (factor * elapsedDays) / stability, -0.5);
}
