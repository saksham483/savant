import {
  LearnerSkillState,
  MasteryTier,
  MasteryTierValue,
  updateTheta,
  calculateAttemptScore,
  sigmoid,
  ErrorCategoryType
} from '@savant/core';

export interface RecordAttemptParams {
  userId: string;
  skillId: string;
  itemDifficulty: number;
  itemFormat: string;
  correct: boolean;
  hintsUsed: number;
  durationMs?: number;
  confidence?: number; // 1 to 5
  errorTag?: string;
  errorCategory?: ErrorCategoryType;
  isDelayedRetentionCheck?: boolean;
  daysSinceFirstSeen?: number;
  isTransferItem?: boolean;
  explainBackPassed?: boolean;
  retrievability?: number; // 0 to 1 from FSRS
}

export class LearnerModel {
  private skillStates: Map<string, LearnerSkillState> = new Map();
  private skillFormatsUsed: Map<string, Set<string>> = new Map();
  private firstSeenDates: Map<string, Date> = new Map();

  getOrCreateState(userId: string, skillId: string): LearnerSkillState {
    const key = `${userId}:${skillId}`;
    if (!this.skillStates.has(key)) {
      this.skillStates.set(key, {
        userId,
        skillId,
        theta: 0.0,
        attemptsCount: 0,
        tier: MasteryTier.FOG,
        strength: 0.0,
        brierScoreSum: 0,
        calibrationCount: 0,
        errorProfile: {}
      });
    }
    return this.skillStates.get(key)!;
  }

  recordAttempt(params: RecordAttemptParams, now: Date = new Date()): {
    state: LearnerSkillState;
    tierUpgraded: boolean;
    previousTier: MasteryTierValue;
  } {
    const state = this.getOrCreateState(params.userId, params.skillId);
    const prevTier = state.tier as MasteryTierValue;
    const key = `${params.userId}:${params.skillId}`;

    if (!this.firstSeenDates.has(key)) {
      this.firstSeenDates.set(key, now);
    }
    const firstSeen = this.firstSeenDates.get(key)!;
    const elapsedDays = params.daysSinceFirstSeen ?? Math.max(0, (now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));

    // Track formats used
    if (!this.skillFormatsUsed.has(key)) {
      this.skillFormatsUsed.set(key, new Set());
    }
    this.skillFormatsUsed.get(key)!.add(params.itemFormat);
    const formatCount = this.skillFormatsUsed.get(key)!.size;

    // Calculate attempt score and update theta
    const score = calculateAttemptScore(params.correct, params.hintsUsed, params.durationMs);
    state.theta = updateTheta(state.theta, params.itemDifficulty, score, state.attemptsCount);
    state.attemptsCount += 1;
    state.lastSeen = now.toISOString();

    // Track error profile
    if (!params.correct && (params.errorCategory || params.errorTag)) {
      const errKey = params.errorCategory || params.errorTag!;
      state.errorProfile[errKey] = (state.errorProfile[errKey] || 0) + 1;
    }

    // Confidence calibration (Brier score)
    if (params.confidence !== undefined) {
      const pConfidence = params.confidence / 5.0;
      const outcome = params.correct ? 1.0 : 0.0;
      const brierContribution = Math.pow(pConfidence - outcome, 2);
      state.brierScoreSum += brierContribution;
      state.calibrationCount += 1;
    }

    // Update strength: sigma(theta - b_ref) * retrievability
    const r = params.retrievability ?? 0.85;
    const bRef = 0.0;
    state.strength = Math.round(sigmoid(state.theta - bRef) * r * 100) / 100;

    // Tier Evaluation (Learning Integrity Rules §5)
    let newTier: MasteryTierValue = state.tier as MasteryTierValue;

    if (state.attemptsCount >= 1 && newTier === MasteryTier.FOG) {
      newTier = MasteryTier.GLIMPSED;
    }

    if (state.attemptsCount >= 3 && state.theta > -0.8 && newTier < MasteryTier.LEARNING) {
      newTier = MasteryTier.LEARNING;
    }

    // SOLID: reliable at mid difficulty, >= 3 days delayed retention, >= 3 formats
    if (
      newTier === MasteryTier.LEARNING &&
      state.theta >= 0.5 &&
      formatCount >= 3 &&
      elapsedDays >= 3 &&
      (params.isDelayedRetentionCheck ? params.correct : true)
    ) {
      newTier = MasteryTier.SOLID;
      state.firstSolidAt = now.toISOString();
    }

    // FLUENT: high difficulty theta >= 1.5, >= 14 days retention check
    if (
      newTier === MasteryTier.SOLID &&
      state.theta >= 1.5 &&
      elapsedDays >= 14 &&
      params.isDelayedRetentionCheck &&
      params.correct
    ) {
      newTier = MasteryTier.FLUENT;
      state.lastRetentionCheckAt = now.toISOString();
    }

    // MASTERED: >= 30 days retention check, transfer item passed, explain-back passed
    if (
      newTier === MasteryTier.FLUENT &&
      elapsedDays >= 30 &&
      params.isDelayedRetentionCheck &&
      params.correct &&
      params.isTransferItem &&
      params.explainBackPassed
    ) {
      newTier = MasteryTier.MASTERED;
      state.lastRetentionCheckAt = now.toISOString();
    }

    const tierUpgraded = newTier > prevTier;
    state.tier = newTier;

    return {
      state,
      tierUpgraded,
      previousTier: prevTier
    };
  }

  getBrierScore(userId: string, skillId: string): number | null {
    const state = this.getOrCreateState(userId, skillId);
    if (state.calibrationCount === 0) return null;
    return Math.round((state.brierScoreSum / state.calibrationCount) * 1000) / 1000;
  }
}
