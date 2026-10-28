import { z } from 'zod';

export const audioTranscriptSchema = z.object({
  requestText: z.string().trim().min(1, 'Request text cannot be empty'),
  materialIds: z.array(z.string().min(1)).min(1, 'At least one material ID is required'),
  materialVersionHashes: z.array(z.string().min(1)).optional(),
  voiceId: z.string().optional(),
  language: z.string().optional(),
});

export const audioGenerateSchema = z.object({
  transcript: z.string().trim().min(1, 'Transcript cannot be empty'),
  materialIds: z.array(z.string().min(1)).min(1, 'At least one material ID is required'),
  materialVersionHashes: z.array(z.string().min(1)).optional(),
  voiceId: z.string().optional(),
  language: z.string().optional(),
  generationId: z.string().optional(),
});

export const audioParamsSchema = z.object({
  id: z.string().trim().min(1, 'Audio ID is required'),
});

export type AudioTranscriptInput = z.infer<typeof audioTranscriptSchema>;
export type AudioGenerateInput = z.infer<typeof audioGenerateSchema>;
export type AudioParamsInput = z.infer<typeof audioParamsSchema>;

