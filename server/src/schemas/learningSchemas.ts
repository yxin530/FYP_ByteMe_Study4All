import { z } from 'zod';

export const explainSchema = z.object({
  query: z.string().trim().min(1, 'Query cannot be empty'),
  materialIds: z.array(z.string().min(1)).min(1, 'At least one material ID is required'),
  materialVersionHashes: z.array(z.string().min(1)).optional(),
  responseFormat: z.enum(['concise', 'detailed', 'step_by_step']).optional(),
});

export const tutorChatSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty'),
  materialIds: z.array(z.string().min(1)).min(1, 'At least one material ID is required'),
  materialVersionHashes: z.array(z.string().min(1)).optional(),
  conversationId: z.string().uuid('Invalid conversation UUID').optional(),
});

export type ExplainInput = z.infer<typeof explainSchema>;
export type TutorChatInput = z.infer<typeof tutorChatSchema>;

