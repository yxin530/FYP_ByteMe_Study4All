import { Router, type RequestHandler } from 'express';
import { notImplemented } from '../errors/apiError.js';
import { validateBody, validateRequest } from '../middleware/validate.js';
import { loginSchema, forgotPasswordSchema, registerSchema } from '../schemas/authSchemas.js';
import { login, register, requestPasswordReset, logout } from '../services/authService.js';
import {
  materialIdSchema,
  uploadBinarySchema,
  uploadMaterialSchema,
  uploadUrlSchema,
} from '../schemas/materialSchemas.js';
import {
  createMaterial,
  deleteMaterial,
  getMaterial,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  listMaterials,
  processMaterial,
  uploadMaterialBinary,
} from '../services/materialService.js';
import { explainSchema, tutorChatSchema } from '../schemas/learningSchemas.js';
import { generateQuizSchema } from '../schemas/quizSchemas.js';
import {
  audioTranscriptSchema,
  audioGenerateSchema,
  audioParamsSchema,
} from '../schemas/audioSchemas.js';
import { requireAuth } from '../security/auth.js';
import type { AuthenticatedRequest } from '../security/auth.js';

const router = Router();

function pending(feature: string): RequestHandler {
  return (_req, _res, next) => next(notImplemented(feature));
}

router.post('/auth/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.json({ session: result });
  } catch (error) {
    next(error);
  }
});
router.post('/auth/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const result = await register(req.body);
    res.status(201).json({ session: result });
  } catch (error) {
    next(error);
  }
});
router.post('/auth/forgot', validateBody(forgotPasswordSchema), async (req, res, next) => {
  try {
    await requestPasswordReset(req.body);
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});
router.post('/auth/logout', async (req, res, next) => {
  try {
    const header = req.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    await logout(token);
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});
router.use(requireAuth);
router.post('/materials', validateBody(uploadMaterialSchema), async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    res.status(201).json({ material: await createMaterial(req.body, authenticated.user, authenticated.accessToken) });
  } catch (error) { next(error); }
});
router.get('/materials', async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    res.json({ materials: await listMaterials(authenticated.user, authenticated.accessToken) });
  } catch (error) { next(error); }
});
router.get('/materials/:id', validateRequest({ params: materialIdSchema }), async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    res.json({ material: await getMaterial(String(req.params.id), authenticated.user, authenticated.accessToken) });
  } catch (error) { next(error); }
});
router.delete('/materials/:id', validateRequest({ params: materialIdSchema }), async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    await deleteMaterial(String(req.params.id), authenticated.user, authenticated.accessToken);
    res.status(204).send();
  } catch (error) { next(error); }
});
router.post('/materials/:id/upload', validateRequest({ params: materialIdSchema, body: uploadBinarySchema }), async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    const material = await uploadMaterialBinary(String(req.params.id), req.body, authenticated.user, authenticated.accessToken);
    res.json({ material });
  } catch (error) { next(error); }
});
router.post('/materials/:id/upload-url', validateRequest({ params: materialIdSchema, body: uploadUrlSchema }), async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    const result = await getSignedUploadUrl(String(req.params.id), req.body.fileName, authenticated.user, authenticated.accessToken);
    res.json(result);
  } catch (error) { next(error); }
});
router.get('/materials/:id/download-url', validateRequest({ params: materialIdSchema }), async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    const result = await getSignedDownloadUrl(String(req.params.id), authenticated.user, authenticated.accessToken);
    res.json(result);
  } catch (error) { next(error); }
});
router.post('/materials/:id/process', validateRequest({ params: materialIdSchema }), async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    const material = await processMaterial(String(req.params.id), authenticated.user, authenticated.accessToken);
    res.json({ material });
  } catch (error) { next(error); }
});
router.post('/learn/explain', validateBody(explainSchema), pending('Grounded explanations'));
router.post('/tutor/chat', validateBody(tutorChatSchema), pending('Tutor chat'));
router.post('/quiz/generate', validateBody(generateQuizSchema), pending('Quiz generation'));
router.post('/audio/transcript', validateBody(audioTranscriptSchema), pending('Audio transcript generation'));
router.post('/audio/generate', validateBody(audioGenerateSchema), pending('Audio generation'));
router.get('/audio/:id', validateRequest({ params: audioParamsSchema }), pending('Audio retrieval'));

export default router;
