import { z } from 'zod';
import { DomainIdSchema } from './domain.js';

export const MasteryTier = {
  FOG: 0,
  GLIMPSED: 1,
  LEARNING: 2,
  SOLID: 3,
  FLUENT: 4,
  MASTERED: 5,
} as const;

export type MasteryTierValue = (typeof MasteryTier)[keyof typeof MasteryTier];

export const MasteryTierNames: Record<MasteryTierValue, string> = {
  0: 'Fog',
  1: 'Glimpsed',
  2: 'Learning',
  3: 'Solid',
  4: 'Fluent',
  5: 'Mastered'
};

export const NodeTypeSchema = z.enum([
  'foundation',
  'skill',
  'bridge_target',
  'capstone',
  'boss'
]);
export type NodeType = z.infer<typeof NodeTypeSchema>;

export const EdgeKindSchema = z.enum([
  'prereq',
  'soft_prereq',
  'bridge'
]);
export type EdgeKind = z.infer<typeof EdgeKindSchema>;

export interface SkillNode {
  id: string; // e.g. M2.10
  domain: z.infer<typeof DomainIdSchema>;
  title: string;
  tier: number; // curriculum tier level (0-5)
  nodeType: NodeType;
  prereqs: string[]; // hard prerequisites (must be >= Solid)
  softPrereqs?: string[]; // optional/helpful
  objectives: string[];
  primer: string; // concise primer text with worked example
  resources: Array<{
    title: string;
    url: string;
    description: string;
    estMinutes?: number;
  }>;
  misconceptions?: Array<{
    id: string;
    text: string;
  }>;
  hooks: string[];
  bridgeCandidates?: string[];
  difficultyRange?: [number, number];
  version?: number;
}

export interface SkillEdge {
  fromId: string;
  toId: string;
  kind: EdgeKind;
  weight?: number;
}

export interface SkillGraphState {
  skillId: string;
  tier: MasteryTierValue;
  theta: number; // ability logit
  strength: number; // 0 to 1
  attemptsCount: number;
  lastSeen?: string;
  firstSolidAt?: string;
  lastRetentionCheckAt?: string;
  errorProfile: Record<string, number>;
}
