import { describe, it, expect } from 'vitest';
import { FSRSScheduler } from '../src/index.js';
import { SRSRating } from '@savant/core';

describe('FSRS Spaced Repetition & Review Triage', () => {
  it('creates new card with default parameters', () => {
    const fsrs = new FSRSScheduler();
    const card = fsrs.createCard('user_1', 'M2.10', 'eig-2x2');
    expect(card.state).toBe('new');
    expect(card.reps).toBe(0);
    expect(card.stability).toBe(1.0);
  });

  it('first review with Good transitions state to review and schedules interval', () => {
    const fsrs = new FSRSScheduler();
    const card = fsrs.createCard('user_1', 'M2.10');
    const now = new Date();
    const { card: updated, log } = fsrs.review(card, SRSRating.GOOD, now);

    expect(updated.state).toBe('review');
    expect(updated.reps).toBe(1);
    expect(updated.stability).toBeGreaterThan(1.0);
    expect(updated.scheduledDays).toBeGreaterThanOrEqual(1);
    expect(log.rating).toBe(SRSRating.GOOD);
  });

  it('rating Again increases lapses and drops stability', () => {
    const fsrs = new FSRSScheduler();
    const card = fsrs.createCard('user_1', 'M2.10');
    const now = new Date();
    // First review good
    const { card: review1 } = fsrs.review(card, SRSRating.GOOD, now);

    // Later review lapses
    const later = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const { card: review2 } = fsrs.review(review1, SRSRating.AGAIN, later);

    expect(review2.lapses).toBe(1);
    expect(review2.state).toBe('relearning');
    expect(review2.stability).toBeLessThan(review1.stability);
  });

  it('Review Triage prioritises lowest retrievability and caps queue without guilt', () => {
    const fsrs = new FSRSScheduler();
    const now = new Date();

    // Create 5 cards with different last review times (different decay)
    const cards = [1, 5, 10, 20, 30].map((daysAgo, idx) => {
      const c = fsrs.createCard('user_1', `skill_${idx}`);
      c.reps = 1;
      c.stability = 3.0;
      c.lastReview = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      return c;
    });

    // Cap at 2 reviews
    const { scheduled, postponed } = fsrs.triageDueCards(cards, 2, {}, now);
    expect(scheduled.length).toBe(2);
    expect(postponed.length).toBe(3);

    // Most overdue card (30 days ago) must be scheduled first
    expect(scheduled[0].skillId).toBe('skill_4');
    expect(scheduled[1].skillId).toBe('skill_3');
  });
});
