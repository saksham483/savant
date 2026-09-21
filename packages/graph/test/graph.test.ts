import { describe, it, expect } from 'vitest';
import { GraphManager } from '../src/index.js';
import { SkillNode, MasteryTier } from '@savant/core';

describe('Skill Graph & Fog of War', () => {
  const rootNode: SkillNode = {
    id: 'M0.1',
    domain: 'math',
    title: 'Logic & Quantifiers',
    tier: 0,
    nodeType: 'foundation',
    prereqs: [],
    objectives: ['Propositional logic', 'Quantifiers'],
    primer: 'Logic primer',
    resources: [],
    hooks: ['Why boolean logic drives circuits']
  };

  const intermediateNode: SkillNode = {
    id: 'M2.8',
    domain: 'math',
    title: 'Linear Maps',
    tier: 2,
    nodeType: 'skill',
    prereqs: ['M0.1'],
    objectives: ['Rank, nullspace'],
    primer: 'Linear maps primer',
    resources: [],
    hooks: ['Matrix transformations']
  };

  const advancedNode: SkillNode = {
    id: 'M2.10',
    domain: 'math',
    title: 'Eigenvalues & Diagonalisation',
    tier: 2,
    nodeType: 'skill',
    prereqs: ['M2.8'],
    objectives: ['Compute eigenvalues', 'Invariant directions'],
    primer: 'Eigenvalue primer',
    resources: [],
    hooks: ['Google PageRank']
  };

  it('root nodes with no prereqs are unlocked by default', () => {
    const gm = new GraphManager();
    gm.addNode(rootNode);
    expect(gm.isNodeUnlocked('M0.1', {})).toBe(true);
    expect(gm.getNodeVisibility('M0.1', {})).toBe('fully_revealed');
  });

  it('requires prerequisites to be at least Solid (tier 3) to unlock', () => {
    const gm = new GraphManager();
    gm.addNode(rootNode);
    gm.addNode(intermediateNode);

    // M0.1 is only Learning (tier 2) -> M2.8 is NOT unlocked
    expect(gm.isNodeUnlocked('M2.8', { 'M0.1': { tier: MasteryTier.LEARNING } })).toBe(false);

    // M0.1 reaches Solid (tier 3) -> M2.8 is UNLOCKED
    expect(gm.isNodeUnlocked('M2.8', { 'M0.1': { tier: MasteryTier.SOLID } })).toBe(true);
  });

  it('handles Fog-of-War visibility accurately', () => {
    const gm = new GraphManager();
    gm.addNode(rootNode);
    gm.addNode(intermediateNode);
    gm.addNode(advancedNode);

    // When M0.1 is Learning (tier 2), intermediateNode (1 hop) is silhouette, advancedNode (2 hops) is fog
    const userStates = { 'M0.1': { tier: MasteryTier.LEARNING } };
    expect(gm.getNodeVisibility('M2.8', userStates)).toBe('silhouette');
    expect(gm.getNodeVisibility('M2.10', userStates)).toBe('fog');

    // When intermediateNode becomes Learning, advancedNode becomes silhouette
    const updatedStates = {
      'M0.1': { tier: MasteryTier.SOLID },
      'M2.8': { tier: MasteryTier.LEARNING }
    };
    expect(gm.getNodeVisibility('M2.10', updatedStates)).toBe('silhouette');
  });

  it('finds goal path topological dependency chain', () => {
    const gm = new GraphManager();
    gm.addNode(rootNode);
    gm.addNode(intermediateNode);
    gm.addNode(advancedNode);

    const path = gm.findGoalPath('M2.10');
    expect(path).toEqual(['M0.1', 'M2.8', 'M2.10']);
  });
});
