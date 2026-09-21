import { describe, it, expect } from 'vitest';
import { FlowMonitor } from '../src/index.js';

describe('Flow Monitor Real-time Adaptation', () => {
  it('triggers decrease_difficulty upon 3 consecutive wrong answers (frustration)', () => {
    const monitor = new FlowMonitor();

    monitor.recordAttempt({ correct: false, durationMs: 15000, skillId: 'M2.10' });
    monitor.recordAttempt({ correct: false, durationMs: 18000, skillId: 'M2.10' });
    const action = monitor.recordAttempt({ correct: false, durationMs: 20000, skillId: 'M2.10' });

    expect(action.type).toBe('decrease_difficulty');
  });

  it('triggers increase_difficulty upon 5 consecutive fast correct answers (boredom)', () => {
    const monitor = new FlowMonitor();
    // Establish normal median duration first
    monitor.recordAttempt({ correct: true, durationMs: 30000, skillId: 'M2.10' });

    // 5 super fast correct attempts (< 0.5x median)
    monitor.recordAttempt({ correct: true, durationMs: 8000, skillId: 'M2.10' });
    monitor.recordAttempt({ correct: true, durationMs: 9000, skillId: 'M2.10' });
    monitor.recordAttempt({ correct: true, durationMs: 7000, skillId: 'M2.10' });
    monitor.recordAttempt({ correct: true, durationMs: 8500, skillId: 'M2.10' });
    const action = monitor.recordAttempt({ correct: true, durationMs: 4000, skillId: 'M2.10' });

    expect(action.type).toBe('increase_difficulty');
  });

  it('detects fragile knowledge when answer is correct but slow with low confidence', () => {
    const monitor = new FlowMonitor();
    // Baseline median
    monitor.recordAttempt({ correct: true, durationMs: 20000, skillId: 'M2.10' });

    // Correct, but took 55s (> 2x median) and confidence was 1 (guessing)
    const action = monitor.recordAttempt({
      correct: true,
      durationMs: 55000,
      confidence: 1,
      skillId: 'M2.10'
    });

    expect(action.type).toBe('queue_retrieval');
    if (action.type === 'queue_retrieval') {
      expect(action.skillId).toBe('M2.10');
    }
  });

  it('offers domain/format switch when skips accumulate', () => {
    const monitor = new FlowMonitor();
    monitor.recordAttempt({ correct: false, durationMs: 5000, skipped: true, skillId: 'M2.10' });
    const action = monitor.recordAttempt({ correct: false, durationMs: 4000, skipped: true, skillId: 'M2.10' });

    expect(action.type).toBe('offer_switch');
  });
});
