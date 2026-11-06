import { z } from 'zod';

export const audioTranscriptSchema = z.object({
  requestText: z.string().trim().min(1, 'Request text cannot be empty'),
  materialIds: z.array(z.string().min(1)).min(1, 'At least one material ID is required'),
  materialVersionHashes: z.array(z.string().min(1)).optional(),
  voiceId: z.string().optional(),
  language: z.string().optional(),
});

export const audioGenerateSchema = z.object({
  transcriptId: z.string().trim().min(1, 'Transcript ID is required'),
  voiceId: z.string().optional(),
  language: z.string().optional(),
});

export const audioParamsSchema = z.object({
  id: z.string().trim().min(1, 'Audio ID is required'),
});

export const audioTranscriptRevisionSchema = z.object({
  transcript: z.string().trim().min(1, 'Transcript cannot be empty'),
});

export type AudioTranscriptInput = z.infer<typeof audioTranscriptSchema>;
export type AudioGenerateInput = z.infer<typeof audioGenerateSchema>;
export type AudioParamsInput = z.infer<typeof audioParamsSchema>;
export type AudioTranscriptRevisionInput = z.infer<typeof audioTranscriptRevisionSchema>;

