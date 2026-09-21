import { describe, it, expect } from 'vitest';
import { MathEngine, CSEngine } from '../src/index.js';
import { Item } from '@savant/core';

describe('Domain Engines: Math & CS', () => {
  const mathItem: Item = {
    id: 'it-eig-grade',
    skillId: 'M2.10',
    familyId: 'eig-compute',
    domain: 'math',
    format: 'computational',
    difficulty: 0.3,
    prompt: 'Find eigenvalues of [[2, 1], [1, 2]]',
    answerKey: { type: 'set-of-numbers', value: [1, 3] },
    solution: 'lambda in {1, 3}',
    provenance: 'generator',
    verifiedBy: ['sympy'],
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const proofItem: Item = {
    id: 'it-proof-grade',
    skillId: 'M2.10',
    familyId: 'eig-proof',
    domain: 'math',
    format: 'proof_scaffold',
    difficulty: 0.5,
    prompt: 'Order proof steps',
    answerKey: { type: 'ordered-sequence', value: ['s1', 's2', 's3'] },
    solution: 's1 -> s2 -> s3',
    provenance: 'curated',
    verifiedBy: ['curated-store'],
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const csItem: Item = {
    id: 'it-bfs-complexity',
    skillId: 'C1.4',
    familyId: 'bfs-comp',
    domain: 'cs',
    format: 'complexity_analysis',
    difficulty: 0.1,
    prompt: 'Complexity of BFS on adjacency list',
    answerKey: { type: 'exact', value: 'O(V + E)' },
    solution: 'O(V + E)',
    provenance: 'curated',
    verifiedBy: ['curated-store'],
    status: 'active',
    createdAt: new Date().toISOString()
  };

  it('MathEngine grades set-of-numbers regardless of order or spacing', async () => {
    const math = new MathEngine();
    
    // Correct (order reversed)
    const result1 = await math.grade(mathItem, [3, 1]);
    expect(result1.correct).toBe(true);
    expect(result1.score).toBe(1.0);

    // Correct string input "1, 3"
    const result2 = await math.grade(mathItem, '1, 3');
    expect(result2.correct).toBe(true);

    // Incorrect numbers
    const result3 = await math.grade(mathItem, [1, 2]);
    expect(result3.correct).toBe(false);
    expect(result3.score).toBe(0.0);
  });

  it('MathEngine grades proof scaffolds with strict sequence matching', async () => {
    const math = new MathEngine();

    const resultCorrect = await math.grade(proofItem, ['s1', 's2', 's3']);
    expect(resultCorrect.correct).toBe(true);

    const resultWrong = await math.grade(proofItem, ['s2', 's1', 's3']);
    expect(resultWrong.correct).toBe(false);
  });

  it('CSEngine grades complexity analysis ignoring whitespace differences', async () => {
    const cs = new CSEngine();

    const result1 = await cs.grade(csItem, 'O(V+E)');
    expect(result1.correct).toBe(true);

    const result2 = await cs.grade(csItem, 'O(V + E)');
    expect(result2.correct).toBe(true);

    const result3 = await cs.grade(csItem, 'O(V^2)');
    expect(result3.correct).toBe(false);
  });
});
