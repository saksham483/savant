import { describe, it, expect } from 'vitest';
import {
  sigmoid,
  logit,
  calculateExpectedScore,
  calculateAttemptScore,
  updateTheta,
  targetDifficultyForSkill,
  calculateKFactor
} from '../src/learner.js';

describe('Learner Model Math', () => {
  it('sigmoid correctly maps 0 to 0.5', () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 4);
    expect(sigmoid(2)).toBeGreaterThan(0.8);
    expect(sigmoid(-2)).toBeLessThan(0.2);
  });

  it('logit is the inverse of sigmoid', () => {
    const val = 0.75;
    expect(sigmoid(logit(val))).toBeCloseTo(val, 4);
  });

  it('calculateExpectedScore produces ~0.75 when difficulty is theta - 1.1', () => {
    const theta = 0.5;
    const b = targetDifficultyForSkill(theta); // 0.5 - 1.1 = -0.6
    const expected = calculateExpectedScore(theta, b); // sigmoid(1.1)
    expect(expected).toBeGreaterThan(0.74);
    expect(expected).toBeLessThan(0.76);
  });

  it('calculateAttemptScore penalizes hints and floors at 0', () => {
    expect(calculateAttemptScore(true, 0)).toBe(1.0);
    expect(calculateAttemptScore(true, 1)).toBe(0.75);
    expect(calculateAttemptScore(true, 2)).toBe(0.50);
    expect(calculateAttemptScore(true, 4)).toBe(0.0);
    expect(calculateAttemptScore(false, 0)).toBe(0.0);
  });

  it('updateTheta increases ability on success and decreases on failure', () => {
    const theta0 = 0.0;
    const b = 0.0;
    const thetaWin = updateTheta(theta0, b, 1.0, 1);
    expect(thetaWin).toBeGreaterThan(theta0);

    const thetaLoss = updateTheta(theta0, b, 0.0, 1);
    expect(thetaLoss).toBeLessThan(theta0);
  });

  it('K factor decreases with number of attempts', () => {
    const k1 = calculateKFactor(0);
    const k10 = calculateKFactor(10);
    const k100 = calculateKFactor(100);
    expect(k1).toBeGreaterThan(k10);
    expect(k10).toBeGreaterThan(k100);
    expect(k100).toBeGreaterThanOrEqual(0.05);
  });
});
