import { z } from 'zod';

export const HintLevelSchema = z.enum(['L0', 'L1', 'L2', 'L3', 'L4']);
export type HintLevel = z.infer<typeof HintLevelSchema>;

export const HintLevelDescriptions: Record<HintLevel, { name: string; cost: number; description: string }> = {
  L0: { name: 'Nudge', cost: 0.05, description: 'Re-read / restate the core goal and constraints.' },
  L1: { name: 'Conceptual Pointer', cost: 0.15, description: 'Highlight the key concept or theorem needed.' },
  L2: { name: 'Strategy Hint', cost: 0.30, description: 'Outline the sequence of logical steps.' },
  L3: { name: 'Partial Step', cost: 0.50, description: 'Show the immediate next transformation or formula.' },
  L4: { name: 'Full Worked Solution', cost: 1.00, description: 'Full walkthrough (queues a fresh similar variant).' }
};

export const TutorHintRequestSchema = z.object({
  itemId: z.string(),
  skillId: z.string(),
  level: HintLevelSchema,
  currentAttempt: z.any().optional(),
  history: z.array(z.string()).optional()
});
export type TutorHintRequest = z.infer<typeof TutorHintRequestSchema>;

export const TutorHintResponseSchema = z.object({
  level: HintLevelSchema,
  message: z.string(),
  guidingQuestion: z.string().optional(),
  cost: z.number(),
  revealsFinalAnswer: z.boolean().default(false)
});
export type TutorHintResponse = z.infer<typeof TutorHintResponseSchema>;

export const ExplainBackRequestSchema = z.object({
  skillId: z.string(),
  topic: z.string(),
  rubricCriteria: z.array(z.string()),
  explanation: z.string()
});
export type ExplainBackRequest = z.infer<typeof ExplainBackRequestSchema>;

export const ExplainBackResponseSchema = z.object({
  score: z.number().min(0).max(1),
  rubricFeedback: z.array(z.object({
    criterion: z.string(),
    met: z.boolean(),
    comment: z.string()
  })),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  overallNote: z.string()
});
export type ExplainBackResponse = z.infer<typeof ExplainBackResponseSchema>;
