import { describe, it, expect } from 'vitest';
import { LearnerModel } from '../src/index.js';
import { MasteryTier } from '@savant/core';

describe('Learner Model & Learning Integrity Gates', () => {
  it('node transitions from Fog to Glimpsed on first attempt', () => {
    const lm = new LearnerModel();
    const { state, tierUpgraded } = lm.recordAttempt({
      userId: 'user_1',
      skillId: 'M2.10',
      itemDifficulty: 0.0,
      itemFormat: 'computational',
      correct: true,
      hintsUsed: 0
    });

    expect(tierUpgraded).toBe(true);
    expect(state.tier).toBe(MasteryTier.GLIMPSED);
  });

  it('node CANNOT reach Solid tier without >= 3 days delayed retention check and >= 3 formats', () => {
    const lm = new LearnerModel();

    // 10 correct attempts on day 0, but only 1 format
    for (let i = 0; i < 10; i++) {
      lm.recordAttempt({
        userId: 'user_1',
        skillId: 'M2.10',
        itemDifficulty: 0.2,
        itemFormat: 'computational',
        correct: true,
        hintsUsed: 0,
        daysSinceFirstSeen: 0 // day 0
      });
    }

    const state = lm.getOrCreateState('user_1', 'M2.10');
    // High ability theta achieved, but still Learning because days < 3 and formats < 3
    expect(state.theta).toBeGreaterThan(1.0);
    expect(state.tier).toBe(MasteryTier.LEARNING);

    // Now test with >= 3 formats on Day 1 (still < 3 days)
    lm.recordAttempt({
      userId: 'user_1',
      skillId: 'M2.10',
      itemDifficulty: 0.5,
      itemFormat: 'proof_scaffold',
      correct: true,
      hintsUsed: 0,
      daysSinceFirstSeen: 1
    });
    lm.recordAttempt({
      userId: 'user_1',
      skillId: 'M2.10',
      itemDifficulty: 0.5,
      itemFormat: 'explain_back',
      correct: true,
      hintsUsed: 0,
      daysSinceFirstSeen: 1
    });

    const stateDay1 = lm.getOrCreateState('user_1', 'M2.10');
    expect(stateDay1.tier).toBe(MasteryTier.LEARNING); // Still not Solid!

    // On Day 4 (>= 3 days), with >= 3 formats, passed delayed check -> reaches SOLID!
    const { state: stateDay4, tierUpgraded } = lm.recordAttempt({
      userId: 'user_1',
      skillId: 'M2.10',
      itemDifficulty: 0.5,
      itemFormat: 'computational',
      correct: true,
      hintsUsed: 0,
      daysSinceFirstSeen: 4,
      isDelayedRetentionCheck: true
    });

    expect(tierUpgraded).toBe(true);
    expect(stateDay4.tier).toBe(MasteryTier.SOLID);
    expect(stateDay4.firstSolidAt).toBeDefined();
  });

  it('tracks confidence calibration with Brier score', () => {
    const lm = new LearnerModel();

    // Perfectly calibrated: confidence 5 (100%), correct
    lm.recordAttempt({
      userId: 'user_1',
      skillId: 'M2.10',
      itemDifficulty: 0.0,
      itemFormat: 'computational',
      correct: true,
      hintsUsed: 0,
      confidence: 5 // p = 1.0, actual = 1.0, error = 0
    });

    expect(lm.getBrierScore('user_1', 'M2.10')).toBe(0.0);

    // Overconfident: confidence 5 (100%), but wrong
    lm.recordAttempt({
      userId: 'user_1',
      skillId: 'M2.10',
      itemDifficulty: 0.5,
      itemFormat: 'computational',
      correct: false,
      hintsUsed: 0,
      confidence: 5 // p = 1.0, actual = 0.0, error = 1.0
    });

    // Average Brier score = (0 + 1) / 2 = 0.5
    expect(lm.getBrierScore('user_1', 'M2.10')).toBe(0.5);
  });
});
