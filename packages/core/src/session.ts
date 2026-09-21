import { z } from 'zod';
import { DomainIdSchema } from './domain.js';
import { ItemFormatSchema, Item } from './item.js';

export const SessionMoodSchema = z.enum([
  'Sharp',
  'Chill',
  'Curious'
]);
export type SessionMood = z.infer<typeof SessionMoodSchema>;

export const BlockTypeSchema = z.enum([
  'warmup',
  'deep',
  'orbit',
  'bridge',
  'boss',
  'wild',
  'forge',
  'rabbit',
  'wrap'
]);
export type BlockType = z.infer<typeof BlockTypeSchema>;

export interface SessionBlock {
  id: string;
  type: BlockType;
  title: string;
  domain?: z.infer<typeof DomainIdSchema>;
  skillId?: string;
  targetMinutes: number;
  items: Item[];
  formatMix: Array<z.infer<typeof ItemFormatSchema>>;
  hook?: string;
}

export interface SessionPlan {
  id: string;
  userId: string;
  minutes: number; // 10, 25, 45, 90
  mood: SessionMood;
  blocks: SessionBlock[];
  totalItems: number;
  createdAt: string;
  completed?: boolean;
  selfRating?: 'boring' | 'just_right' | 'too_hard';
}

export interface FlowState {
  consecutiveCorrect: number;
  consecutiveWrong: number;
  skipCountWindow: number;
  recentItemsCount: number;
  currentStreak: number;
  medianDurationMs: number;
}

export type FlowAction = 
  | { type: 'continue' }
  | { type: 'decrease_difficulty'; step: number; reason: string }
  | { type: 'increase_difficulty'; step: number; reason: string }
  | { type: 'offer_hint'; level: number }
  | { type: 'offer_switch'; choices: string[] }
  | { type: 'queue_retrieval'; skillId: string }
  | { type: 'extend_flow'; maxExtraMinutes: number };
