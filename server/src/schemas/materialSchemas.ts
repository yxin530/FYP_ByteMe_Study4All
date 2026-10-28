import { z } from 'zod';

export const uploadMaterialSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(255, 'Title exceeds 255 characters'),
  fileType: z.enum(['pdf', 'image', 'text', 'doc'], {
    error: 'fileType must be one of pdf, image, text, doc',
  }),
  fileName: z.string().trim().min(1).max(255).optional(),
  subject: z.string().trim().min(1).max(100).optional(),
  content: z.string().max(20_000_000).optional(),
});

export const uploadBinarySchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(100).optional(),
  dataBase64: z.string().min(1, 'Binary payload dataBase64 is required'),
});

export const uploadUrlSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
});

export const materialIdSchema = z.object({
  id: z.string().uuid('Invalid material UUID format'),
});

export type UploadMaterialInput = z.infer<typeof uploadMaterialSchema>;
export type UploadBinaryInput = z.infer<typeof uploadBinarySchema>;
export type UploadUrlInput = z.infer<typeof uploadUrlSchema>;
