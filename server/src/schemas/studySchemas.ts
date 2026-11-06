import { z } from 'zod';
export const studyProfileSchema = z.object({ displayName: z.string().trim().min(1).max(80), learningSubjects: z.array(z.string().trim().min(1)).max(20), teachingSubjects: z.array(z.string().trim().min(1)).max(20), availability: z.array(z.string().trim().min(1)).max(20), discoverable: z.boolean() });
export const matchSchema = z.object({ subject: z.string().trim().min(1).max(100) });
export const groupSchema = z.object({ name: z.string().trim().min(1).max(100), subject: z.string().trim().min(1).max(100), memberIds: z.array(z.string().uuid()).max(20).default([]) });
export const messageSchema = z.object({ body: z.string().trim().min(1).max(2000) });
export const groupParamsSchema = z.object({ id: z.string().uuid() });
export const rescueSchema = z.object({ examDate: z.string().date(), subjects: z.array(z.object({ subject: z.string().min(1), materialIds: z.array(z.string().uuid()).min(1) })).min(1), availableMinutes: z.number().int().positive().max(10080) });
export const questSchema = z.object({ subject: z.string().trim().min(1), materialIds: z.array(z.string().uuid()).min(1) });
export const weeklyQuizSchema = z.object({ questionCount: z.number().int().min(1).max(20).default(5) });
