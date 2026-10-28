import { Router, type RequestHandler } from 'express';
import { notImplemented } from '../errors/apiError.js';
import { validateBody, validateRequest } from '../middleware/validate.js';
import { loginSchema, forgotPasswordSchema } from '../schemas/authSchemas.js';
import { uploadMaterialSchema } from '../schemas/materialSchemas.js';
import { explainSchema, tutorChatSchema } from '../schemas/learningSchemas.js';
import { generateQuizSchema } from '../schemas/quizSchemas.js';
import {
  audioTranscriptSchema,
  audioGenerateSchema,
  audioParamsSchema,
} from '../schemas/audioSchemas.js';

const router = Router();

function pending(feature: string): RequestHandler {
  return (_req, _res, next) => next(notImplemented(feature));
}

router.post('/auth/login', validateBody(loginSchema), pending('Authentication'));
router.post('/auth/forgot', validateBody(forgotPasswordSchema), pending('Password recovery'));
router.post('/materials', validateBody(uploadMaterialSchema), pending('Material upload'));
router.post('/learn/explain', validateBody(explainSchema), pending('Grounded explanations'));
router.post('/tutor/chat', validateBody(tutorChatSchema), pending('Tutor chat'));
router.post('/quiz/generate', validateBody(generateQuizSchema), pending('Quiz generation'));
router.post('/audio/transcript', validateBody(audioTranscriptSchema), pending('Audio transcript generation'));
router.post('/audio/generate', validateBody(audioGenerateSchema), pending('Audio generation'));
router.get('/audio/:id', validateRequest({ params: audioParamsSchema }), pending('Audio retrieval'));

export default router;
