import { z } from 'zod';
export const notificationPreferencesSchema = z.object({ pushEnabled: z.boolean(), dailyRemindersEnabled: z.boolean(), reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(), timezone: z.string().trim().min(1).max(80) });
export const deviceTokenSchema = z.object({ token: z.string().trim().min(10).max(4096), platform: z.enum(['ios', 'android', 'web']) });
export const reminderSchema = z.object({ title: z.string().trim().min(1).max(120), body: z.string().trim().min(1).max(500), scheduledFor: z.string().datetime(), timezone: z.string().trim().min(1).max(80) });
export const reminderParamsSchema = z.object({ id: z.string().uuid() });
