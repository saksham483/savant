import { describe, it, expect } from 'vitest';
import { SessionPlanner, validateVarietyRules } from '../src/index.js';
import { Item } from '@savant/core';

describe('Session Planner & Variety Rules', () => {
  const sampleItems: Item[] = [
    {
      id: 'it-math-1',
      skillId: 'M2.10',
      familyId: 'eig-comp',
      domain: 'math',
      format: 'computational',
      difficulty: 0.2,
      prompt: 'Find eigenvalues',
      answerKey: { type: 'set-of-numbers', value: [1, 2] },
      solution: 'sol',
      provenance: 'generator',
      verifiedBy: ['sympy'],
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'it-math-2',
      skillId: 'M2.10',
      familyId: 'eig-proof',
      domain: 'math',
      format: 'proof_scaffold',
      difficulty: 0.6,
      prompt: 'Order proof steps',
      answerKey: { type: 'ordered-sequence', value: ['s1', 's2'] },
      solution: 'sol',
      provenance: 'curated',
      verifiedBy: ['sympy'],
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'it-cs-1',
      skillId: 'C1.4',
      familyId: 'bfs-code',
      domain: 'cs',
      format: 'write_code',
      difficulty: 0.5,
      prompt: 'Implement BFS',
      answerKey: { type: 'code-tests', value: 'code' },
      solution: 'sol',
      provenance: 'generator',
      verifiedBy: ['pytest'],
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'it-astro-1',
      skillId: 'A2',
      familyId: 'orbit-comp',
      domain: 'astronomy',
      format: 'computational',
      difficulty: 0.1,
      prompt: 'Compute Kepler orbital period',
      answerKey: { type: 'numeric', value: 365 },
      solution: 'sol',
      provenance: 'curated',
      verifiedBy: ['curated-store'],
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'it-math-3',
      skillId: 'M2.10',
      familyId: 'eig-exp',
      domain: 'math',
      format: 'explain_back',
      difficulty: 0.8,
      prompt: 'Explain invariant axes',
      answerKey: { type: 'rubric', rubricCriteria: ['c1'] },
      solution: 'sol',
      provenance: 'curated',
      verifiedBy: ['curated-store'],
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ];

  it('generates a structured 25-min session across Warm-up, Deep, Orbit, and Wrap blocks', () => {
    const planner = new SessionPlanner();
    const session = planner.planSession({
      userId: 'user_1',
      minutes: 25,
      mood: 'Sharp',
      userThetas: { 'M2.10': 0.5, 'C1.4': 0.2, 'A2': 0.0 },
      availableItems: sampleItems
    });

    expect(session.minutes).toBe(25);
    expect(session.blocks.length).toBeGreaterThanOrEqual(3);
    const blockTypes = session.blocks.map(b => b.type);
    expect(blockTypes).toContain('warmup');
    expect(blockTypes).toContain('deep');
    expect(blockTypes).toContain('orbit');

    const allItems = session.blocks.flatMap(b => b.items);
    expect(allItems.length).toBeGreaterThanOrEqual(3);

    // Variety check
    const varietyResult = validateVarietyRules(allItems, 25);
    expect(varietyResult.valid).toBe(true);
  });

  it('detects violations of > 4 consecutive same formats', () => {
    const repetitiveItems: Item[] = Array.from({ length: 5 }, (_, i) => ({
      ...sampleItems[0],
      id: `rep_${i}`,
      format: 'computational'
    }));

    const result = validateVarietyRules(repetitiveItems, 25);
    expect(result.valid).toBe(false);
    expect(result.violations[0]).toContain('consecutive');
  });

  it('detects missing domain variety', () => {
    // Only math items
    const singleDomainItems: Item[] = [sampleItems[0], sampleItems[1], sampleItems[4]];
    const result = validateVarietyRules(singleDomainItems, 25);
    expect(result.valid).toBe(false);
    expect(result.violations.some(v => v.includes('domain'))).toBe(true);
  });
});
