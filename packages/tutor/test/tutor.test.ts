import { describe, it, expect } from 'vitest';
import { TutorService, GeminiClient } from '../src/index.js';
import { Item } from '@savant/core';

describe('Tutor Service & Gemini 3.8 Flash Integration', () => {
  const mockItem: Item = {
    id: 'item-eig-1',
    skillId: 'M2.10',
    familyId: 'eig-2x2',
    domain: 'math',
    format: 'computational',
    difficulty: 0.5,
    prompt: 'Find the eigenvalues of matrix [[2, 1], [1, 2]]',
    answerKey: { type: 'set-of-numbers', value: [1, 3] },
    solution: 'det(A - lambda*I) = (2-lambda)^2 - 1 = 0 => (2-lambda) = +-1 => lambda in {1, 3}',
    provenance: 'generator',
    verifiedBy: ['sympy'],
    status: 'active',
    createdAt: new Date().toISOString()
  };

  it('initializes with model gemini-3.8-flash', () => {
    const client = new GeminiClient();
    expect(client.getModel()).toBe('gemini-3.8-flash');
  });

  it('Hint ladder L0-L3 never reveals final answer (Rule 1)', async () => {
    const tutor = new TutorService();

    const hint0 = await tutor.getHint({ itemId: mockItem.id, skillId: mockItem.skillId, level: 'L0' }, mockItem);
    expect(hint0.level).toBe('L0');
    expect(hint0.revealsFinalAnswer).toBe(false);
    expect(hint0.cost).toBe(0.05);

    const hint1 = await tutor.getHint({ itemId: mockItem.id, skillId: mockItem.skillId, level: 'L1' }, mockItem);
    expect(hint1.level).toBe('L1');
    expect(hint1.revealsFinalAnswer).toBe(false);
    expect(hint1.cost).toBe(0.15);

    const hint2 = await tutor.getHint({ itemId: mockItem.id, skillId: mockItem.skillId, level: 'L2' }, mockItem);
    expect(hint2.level).toBe('L2');
    expect(hint2.revealsFinalAnswer).toBe(false);
    expect(hint2.cost).toBe(0.30);

    const hint3 = await tutor.getHint({ itemId: mockItem.id, skillId: mockItem.skillId, level: 'L3' }, mockItem);
    expect(hint3.level).toBe('L3');
    expect(hint3.revealsFinalAnswer).toBe(false);
    expect(hint3.cost).toBe(0.50);
  });

  it('Hint L4 reveals final solution and marks revealsFinalAnswer true', async () => {
    const tutor = new TutorService();
    const hint4 = await tutor.getHint({ itemId: mockItem.id, skillId: mockItem.skillId, level: 'L4' }, mockItem);
    expect(hint4.level).toBe('L4');
    expect(hint4.revealsFinalAnswer).toBe(true);
    expect(hint4.cost).toBe(1.0);
    expect(hint4.message).toContain('lambda');
  });

  it('evaluates explain-back against rubric', async () => {
    const tutor = new TutorService();
    const evalResult = await tutor.evaluateExplainBack({
      skillId: 'M2.10',
      topic: 'Eigenvalues and Eigenvectors',
      rubricCriteria: [
        'Explains invariant direction geometrically',
        'Explains eigenvalue as scaling factor',
        'Relates to det(A - lambda*I) = 0'
      ],
      explanation: 'An eigenvector represents a special direction in space that only gets scaled, never rotated by the transformation matrix. The eigenvalue is the amount of scaling along that direction. We set det(A - lambda*I) = 0 because the kernel must be non-trivial.'
    });

    expect(evalResult.score).toBeGreaterThanOrEqual(0);
    expect(evalResult.score).toBeLessThanOrEqual(1);
    expect(evalResult.rubricFeedback.length).toBe(3);
    expect(evalResult.strengths.length).toBeGreaterThan(0);
  });
});
