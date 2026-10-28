import { z } from 'zod';

export const generateQuizSchema = z.object({
  subject: z.string().trim().min(1, 'Subject cannot be empty'),
  topic: z.string().trim().min(1, 'Topic cannot be empty'),
  materialIds: z.array(z.string().min(1)).min(1, 'At least one material ID is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  questionCount: z.number().int().min(1).max(20).default(5),
});

export const submitQuizSchema = z.object({
  quizId: z.string().min(1),
  answers: z.array(z.object({
    questionId: z.string().min(1),
    answer: z.string().min(1),
  })).min(1).max(50),
});

export const explainQuizAnswerSchema = z.object({
  quizId: z.string().min(1),
  questionId: z.string().min(1),
});

export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type ExplainQuizAnswerInput = z.infer<typeof explainQuizAnswerSchema>;

