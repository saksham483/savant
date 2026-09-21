import { FlowAction } from '@savant/core';

export interface RecentAttemptEvent {
  correct: boolean;
  durationMs: number;
  skipped?: boolean;
  confidence?: number; // 1 to 5
  skillId: string;
}

export class FlowMonitor {
  private recentEvents: RecentAttemptEvent[] = [];
  private consecutiveCorrect: number = 0;
  private consecutiveWrong: number = 0;
  private durations: number[] = [];

  getMedianDuration(): number {
    if (this.durations.length === 0) return 30_000; // default 30s
    const sorted = [...this.durations].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  recordAttempt(event: RecentAttemptEvent): FlowAction {
    // Calculate baseline median before adding the current event's duration
    const median = this.getMedianDuration();

    this.recentEvents.push(event);
    if (this.recentEvents.length > 20) {
      this.recentEvents.shift();
    }
    this.durations.push(event.durationMs);
    if (this.durations.length > 30) {
      this.durations.shift();
    }

    if (event.skipped) {
      const recentSkips = this.recentEvents.slice(-5).filter(e => e.skipped).length;
      if (recentSkips >= 2) {
        return {
          type: 'offer_switch',
          choices: ['Switch Domain', 'Try a different format', 'Take a break']
        };
      }
    }

    if (event.correct) {
      this.consecutiveCorrect += 1;
      this.consecutiveWrong = 0;
    } else {
      this.consecutiveWrong += 1;
      this.consecutiveCorrect = 0;
    }

    // 1. Frustration signal: 3 wrong in a row or time > 2x median on error
    if (this.consecutiveWrong >= 3 || (event.durationMs > 2.0 * median && !event.correct)) {
      return {
        type: 'decrease_difficulty',
        step: 1,
        reason: 'Detected struggle. Adjusting to a confidence-building variant.'
      };
    }

    // 2. Boredom / Too Easy signal: 5 correct in a row and time < 0.6x baseline median
    if (this.consecutiveCorrect >= 5 && event.durationMs < 0.6 * median) {
      return {
        type: 'increase_difficulty',
        step: 2,
        reason: 'High fluency detected. Offering a stretch challenge!'
      };
    }

    // 3. Fragile knowledge signal: Correct + slow (> 1.5x median) + low confidence (<= 2)
    if (event.correct && event.durationMs > 1.5 * median && event.confidence !== undefined && event.confidence <= 2) {
      return {
        type: 'queue_retrieval',
        skillId: event.skillId
      };
    }

    // 4. In flow: steady performance
    if (this.consecutiveCorrect >= 3 && event.durationMs >= 0.4 * median && event.durationMs <= 1.6 * median) {
      return {
        type: 'extend_flow',
        maxExtraMinutes: 5
      };
    }

    return { type: 'continue' };
  }

  calculateBoredomProxyScore(params: {
    skipRate: number;
    abandonRate: number;
    selfRating?: 'boring' | 'just_right' | 'too_hard';
  }): number {
    let score = 0;
    score += params.skipRate * 0.35;
    score += params.abandonRate * 0.35;
    if (params.selfRating === 'boring') {
      score += 0.30;
    }
    return Math.min(1.0, Math.round(score * 100) / 100);
  }
}
