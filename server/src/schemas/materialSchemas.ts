import { z } from 'zod';

export const uploadMaterialSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(255, 'Title exceeds 255 characters'),
  fileType: z.enum(['pdf', 'image', 'text', 'doc'], {
    error: 'fileType must be one of pdf, image, text, doc',
  }),
  content: z.string().optional(),
});

export type UploadMaterialInput = z.infer<typeof uploadMaterialSchema>;

