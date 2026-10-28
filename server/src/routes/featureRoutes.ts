import { Router, type RequestHandler } from 'express';
import { notImplemented } from '../errors/apiError.js';

const router = Router();

function pending(feature: string): RequestHandler {
  return (_req, _res, next) => next(notImplemented(feature));
}

router.post('/auth/login', pending('Authentication'));
router.post('/auth/forgot', pending('Password recovery'));
router.post('/materials', pending('Material upload'));
router.post('/learn/explain', pending('Grounded explanations'));
router.post('/tutor/chat', pending('Tutor chat'));
router.post('/quiz/generate', pending('Quiz generation'));
router.post('/audio/transcript', pending('Audio transcript generation'));
router.post('/audio/generate', pending('Audio generation'));
router.get('/audio/:id', pending('Audio retrieval'));

export default router;
