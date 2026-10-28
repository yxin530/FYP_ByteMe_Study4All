import { z } from 'zod';

export const generateQuizSchema = z.object({
  subject: z.string().trim().min(1, 'Subject cannot be empty'),
  topic: z.string().trim().min(1, 'Topic cannot be empty'),
  materialIds: z.array(z.string().min(1)).min(1, 'At least one material ID is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  questionCount: z.number().int().min(1).max(20).default(5),
});

export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;

