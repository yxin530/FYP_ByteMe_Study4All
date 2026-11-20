import { z } from 'zod';

const uuid = z.string().uuid();
export const whiteboardGroupParamsSchema = z.object({ id: uuid });
export const whiteboardCreateGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  memberIds: z.array(uuid).max(30).default([]),
  studyGroupId: uuid.optional(),
});
export const whiteboardMessageSchema = z.object({ body: z.string().trim().min(1).max(2000) });
export const whiteboardSaveSchema = z.object({ title: z.string().trim().min(1).max(160), content: z.string().max(50000), expectedRevision: z.number().int().nonnegative() });
export const whiteboardAskSchema = z.object({ question: z.string().trim().min(1).max(2000), materialIds: z.array(uuid).min(1).max(20) });
export const whiteboardProposeEditSchema = z.object({ instruction: z.string().trim().min(1).max(2000), materialIds: z.array(uuid).min(1).max(20) });
export const whiteboardAcceptEditSchema = z.object({ title: z.string().trim().min(1).max(160), content: z.string().max(50000), expectedRevision: z.number().int().nonnegative(), sourceReferences: z.array(z.object({ materialId: uuid, materialVersionHash: z.string().min(1) })).min(1) });
