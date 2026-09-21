import {
  SRSCard,
  ReviewLog,
  SRSRating,
  SRSRatingValue,
  calculateRetrievability
} from '@savant/core';

export interface FSRSParameters {
  w: number[]; // FSRS weights
  requestRetention: number; // default 0.90
}

export const DEFAULT_FSRS_PARAMS: FSRSParameters = {
  w: [
    0.4, 0.9, 2.3, 10.9, // initial stabilities for [Again, Hard, Good, Easy]
    4.93, 0.94, 0.86, 0.01, // difficulty updates
    1.49, 0.14, 0.94, // stability updates
    2.18, 0.05, 0.34, 1.26 // lapse and recall dynamics
  ],
  requestRetention: 0.90
};

export class FSRSScheduler {
  private params: FSRSParameters;

  constructor(params: FSRSParameters = DEFAULT_FSRS_PARAMS) {
    this.params = params;
  }

  createCard(userId: string, skillId: string, familyId?: string): SRSCard {
    return {
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      skillId,
      familyId,
      due: new Date().toISOString(),
      stability: 1.0,
      difficulty: 5.0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: 'new'
    };
  }

  review(card: SRSCard, rating: SRSRatingValue, now: Date = new Date()): { card: SRSCard; log: ReviewLog } {
    const lastReviewDate = card.lastReview ? new Date(card.lastReview) : now;
    const elapsedDays = Math.max(0, (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24));
    const retrievability = card.reps === 0 ? 1.0 : calculateRetrievability(elapsedDays, card.stability);

    let nextStability: number;
    let nextDifficulty: number;
    let nextState: 'learning' | 'review' | 'relearning' = 'review';
    let lapses = card.lapses;

    // Difficulty update: D' = D - w[6] * (rating - 3)
    const dFactor = this.params.w[6] || 0.86;
    nextDifficulty = Math.max(1, Math.min(10, card.difficulty - dFactor * (rating - 3)));

    if (card.reps === 0) {
      // First review
      const initStabilities = [
        this.params.w[0] || 0.4,
        this.params.w[1] || 0.9,
        this.params.w[2] || 2.3,
        this.params.w[3] || 10.9
      ];
      nextStability = initStabilities[rating - 1] || 1.0;
      nextState = rating === SRSRating.AGAIN ? 'learning' : 'review';
      if (rating === SRSRating.AGAIN) lapses++;
    } else {
      if (rating === SRSRating.AGAIN) {
        lapses++;
        nextState = 'relearning';
        // Post-lapse stability
        nextStability = Math.max(0.2, card.stability * 0.25);
      } else {
        // Successful retrieval stability increase
        const hardPenalty = rating === SRSRating.HARD ? 0.8 : 1.0;
        const easyBonus = rating === SRSRating.EASY ? 1.3 : 1.0;
        const sInc = 1 + (11 - nextDifficulty) * (1 - retrievability) * hardPenalty * easyBonus;
        nextStability = Math.max(card.stability * 1.05, card.stability * sInc);
      }
    }

    // Interval calculation: I = S * ln(R) / ln(0.9)
    const factor = Math.log(this.params.requestRetention) / Math.log(0.9);
    const scheduledDays = Math.max(1, Math.round(nextStability * factor));

    const dueDate = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);

    const updatedCard: SRSCard = {
      ...card,
      stability: Math.round(nextStability * 100) / 100,
      difficulty: Math.round(nextDifficulty * 100) / 100,
      elapsedDays: Math.round(elapsedDays * 10) / 10,
      scheduledDays,
      due: dueDate.toISOString(),
      lastReview: now.toISOString(),
      reps: card.reps + 1,
      lapses,
      state: nextState
    };

    const log: ReviewLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cardId: card.id,
      rating,
      reviewedAt: now.toISOString(),
      elapsedDays,
      scheduledDays,
      stateBefore: card.state
    };

    return { card: updatedCard, log };
  }

  /**
   * Review Triage (§7.1): Cap reviews to preserve session budget.
   * Prioritise lowest retrievability * strategic importance.
   * Postpone remaining cards gracefully without guilt UI.
   */
  triageDueCards(
    cards: SRSCard[],
    maxCards: number,
    importanceMap: Record<string, number> = {},
    now: Date = new Date()
  ): { scheduled: SRSCard[]; postponed: SRSCard[] } {
    const scored = cards.map(c => {
      const lastReview = c.lastReview ? new Date(c.lastReview) : new Date(c.due);
      const elapsed = Math.max(0, (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
      const r = calculateRetrievability(elapsed, c.stability);
      const importance = importanceMap[c.skillId] || 1.0;
      // Urgent: low retrievability (high forgetting risk) and high importance
      const urgency = (1.0 - r) * importance;
      return { card: c, urgency };
    });

    scored.sort((a, b) => b.urgency - a.urgency);

    const scheduled = scored.slice(0, maxCards).map(s => s.card);
    const postponed = scored.slice(maxCards).map(s => s.card);

    return { scheduled, postponed };
  }
}
