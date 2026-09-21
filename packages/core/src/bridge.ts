import { z } from 'zod';

export const BridgeKindSchema = z.enum([
  'analogy',
  'method-transfer',
  'shared-structure',
  'application'
]);
export type BridgeKind = z.infer<typeof BridgeKindSchema>;

export interface Bridge {
  id: string;
  nodeA: string; // e.g. M2.10
  nodeB: string; // e.g. R4
  kind: BridgeKind;
  title: string;
  insight: string; // 2-4 sentences
  challenge: {
    prompt: string;
    starterHint?: string;
    deliverableType: 'code' | 'math' | 'text';
  };
  explainPrompt: string; // "How is X like Y in your own words?"
  unlockCondition: {
    minTierNodeA: number; // typically >= 2 (Learning)
    minTierNodeB: number;
  };
  origin: 'seed' | 'llm' | 'user';
}

export interface PerspectiveForgeProblem {
  id: string;
  title: string;
  scenario: string;
  lenses: Array<{
    name: string; // e.g. "Linear Algebra (Normal Equations)", "Calculus (Optimization)"
    domain: string;
    prompt: string;
    rubricPoints: string[];
  }>;
  comparisonPrompt: string; // "When is Lens A computationally or intuitively superior to Lens B?"
}
