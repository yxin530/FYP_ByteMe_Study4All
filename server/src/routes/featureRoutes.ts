import { Router, type RequestHandler } from 'express';
import { notImplemented } from '../errors/apiError.js';
import { validateBody, validateRequest } from '../middleware/validate.js';
import { loginSchema, forgotPasswordSchema, registerSchema } from '../schemas/authSchemas.js';
import { login, register, requestPasswordReset, logout } from '../services/authService.js';
import { uploadMaterialSchema } from '../schemas/materialSchemas.js';
import { explainSchema, tutorChatSchema } from '../schemas/learningSchemas.js';
import { generateQuizSchema } from '../schemas/quizSchemas.js';
import {
  audioTranscriptSchema,
  audioGenerateSchema,
  audioParamsSchema,
} from '../schemas/audioSchemas.js';
import { requireAuth } from '../security/auth.js';

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
router.post('/materials', validateBody(uploadMaterialSchema), pending('Material upload'));
router.post('/learn/explain', validateBody(explainSchema), pending('Grounded explanations'));
router.post('/tutor/chat', validateBody(tutorChatSchema), pending('Tutor chat'));
router.post('/quiz/generate', validateBody(generateQuizSchema), pending('Quiz generation'));
router.post('/audio/transcript', validateBody(audioTranscriptSchema), pending('Audio transcript generation'));
router.post('/audio/generate', validateBody(audioGenerateSchema), pending('Audio generation'));
router.get('/audio/:id', validateRequest({ params: audioParamsSchema }), pending('Audio retrieval'));

export default router;
