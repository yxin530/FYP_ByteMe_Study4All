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
import { generateQuizSchema, submitQuizSchema, explainQuizAnswerSchema } from '../schemas/quizSchemas.js';
import {
  audioTranscriptSchema,
  audioGenerateSchema,
  audioParamsSchema,
  audioTranscriptRevisionSchema,
} from '../schemas/audioSchemas.js';
import { requireAuth } from '../security/auth.js';
import type { AuthenticatedRequest } from '../security/auth.js';
import { routeTutorRequest } from '../services/orchestratorService.js';
import { generateQuiz, submitQuiz, explainQuizAnswer } from '../services/quizSkill.js';
import { getLearningProfile } from '../services/learningProfileService.js';
import { createGroup, createQuest, createRescue, findMatch, listMessages, saveProfile, sendMessage, weeklyQuiz } from '../services/studyFeatureService.js';
import { groupParamsSchema, groupSchema, matchSchema, messageSchema, questSchema, rescueSchema, studyProfileSchema, weeklyQuizSchema } from '../schemas/studySchemas.js';
import { approveTranscript, createTranscript, reviseTranscript } from '../services/audioTranscriptService.js';
import { generateAudio, getAudio } from '../services/audioGenerationService.js';
import { cancelReminder, createReminder, getPreferences, listReminders, registerToken, removeToken, savePreferences } from '../services/notificationService.js';
import { deviceTokenSchema, notificationPreferencesSchema, reminderParamsSchema, reminderSchema } from '../schemas/notificationSchemas.js';

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
router.post('/learn/explain', validateBody(explainSchema), async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    const routed = await routeTutorRequest(req.body, authenticated.user, authenticated.accessToken);
    res.json({ ...routed.result, requestId: routed.requestId, agent: routed.agent });
  } catch (error) { next(error); }
});
router.post('/tutor/chat', validateBody(tutorChatSchema), async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    const routed = await routeTutorRequest(req.body, authenticated.user, authenticated.accessToken);
    res.json({ ...routed.result, requestId: routed.requestId, agent: routed.agent });
  } catch (error) { next(error); }
});
router.post('/quiz/generate', validateBody(generateQuizSchema), async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    res.status(201).json(await generateQuiz(req.body, authenticated.user, authenticated.accessToken));
  } catch (error) { next(error); }
});
router.post('/quiz/submit', validateBody(submitQuizSchema), async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    res.json(await submitQuiz(req.body, authenticated.user, authenticated.accessToken));
  } catch (error) { next(error); }
});
router.post('/quiz/explain', validateBody(explainQuizAnswerSchema), async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    res.json(await explainQuizAnswer(req.body.quizId, req.body.questionId, authenticated.user, authenticated.accessToken));
  } catch (error) { next(error); }
});
router.get('/profile', async (req, res, next) => {
  try {
    const authenticated = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string };
    res.json(await getLearningProfile(authenticated.user, authenticated.accessToken));
  } catch (error) { next(error); }
});
router.post('/study/profile', validateBody(studyProfileSchema), async (req, res, next) => { try { const a = req as any; res.json(await saveProfile(req.body, a.user, a.accessToken)); } catch (e) { next(e); } });
router.post('/study/match', validateBody(matchSchema), async (req, res, next) => { try { const a = req as any; res.json(await findMatch(req.body.subject, a.user, a.accessToken)); } catch (e) { next(e); } });
router.post('/study/groups', validateBody(groupSchema), async (req, res, next) => { try { const a = req as any; res.status(201).json(await createGroup(req.body, a.user, a.accessToken)); } catch (e) { next(e); } });
router.get('/study/groups/:id/messages', validateRequest({ params: groupParamsSchema }), async (req, res, next) => { try { const a = req as any; res.json({ messages: await listMessages(String(req.params.id), a.user, a.accessToken) }); } catch (e) { next(e); } });
router.post('/study/groups/:id/messages', validateRequest({ params: groupParamsSchema, body: messageSchema }), async (req, res, next) => { try { const a = req as any; res.status(201).json(await sendMessage(String(req.params.id), req.body.body, a.user, a.accessToken)); } catch (e) { next(e); } });
router.post('/study/groups/:id/weekly-quiz', validateRequest({ params: groupParamsSchema, body: weeklyQuizSchema }), async (req, res, next) => { try { const a = req as any; res.status(201).json(await weeklyQuiz(String(req.params.id), req.body.questionCount, a.user, a.accessToken)); } catch (e) { next(e); } });
router.post('/study/rescue', validateBody(rescueSchema), async (req, res, next) => { try { const a = req as any; res.status(201).json(await createRescue(req.body, a.user, a.accessToken)); } catch (e) { next(e); } });
router.post('/study/quest', validateBody(questSchema), async (req, res, next) => { try { const a = req as any; res.status(201).json(await createQuest(req.body, a.user, a.accessToken)); } catch (e) { next(e); } });
router.get('/notifications/preferences', async (req, res, next) => { try { const a = req as any; res.json(await getPreferences(a.user, a.accessToken)); } catch (e) { next(e); } });
router.put('/notifications/preferences', validateBody(notificationPreferencesSchema), async (req, res, next) => { try { const a = req as any; res.json(await savePreferences(req.body, a.user, a.accessToken)); } catch (e) { next(e); } });
router.post('/notifications/device-tokens', validateBody(deviceTokenSchema), async (req, res, next) => { try { const a = req as any; res.status(201).json(await registerToken(req.body, a.user, a.accessToken)); } catch (e) { next(e); } });
router.delete('/notifications/device-tokens', validateBody(deviceTokenSchema.pick({ token: true })), async (req, res, next) => { try { const a = req as any; res.json(await removeToken(req.body.token, a.user, a.accessToken)); } catch (e) { next(e); } });
router.get('/notifications/reminders', async (req, res, next) => { try { const a = req as any; res.json({ reminders: await listReminders(a.user, a.accessToken) }); } catch (e) { next(e); } });
router.post('/notifications/reminders', validateBody(reminderSchema), async (req, res, next) => { try { const a = req as any; res.status(201).json(await createReminder(req.body, a.user, a.accessToken)); } catch (e) { next(e); } });
router.delete('/notifications/reminders/:id', validateRequest({ params: reminderParamsSchema }), async (req, res, next) => { try { const a = req as any; res.json(await cancelReminder(String(req.params.id), a.user, a.accessToken)); } catch (e) { next(e); } });
router.post('/audio/transcript', validateBody(audioTranscriptSchema), async (req, res, next) => {
  try { const a = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string }; res.status(201).json(await createTranscript(req.body, a.user, a.accessToken)); } catch (error) { next(error); }
});
router.patch('/audio/transcript/:id', validateRequest({ params: audioParamsSchema, body: audioTranscriptRevisionSchema }), async (req, res, next) => {
  try { const a = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string }; res.json(await reviseTranscript(String(req.params.id), req.body, a.user, a.accessToken)); } catch (error) { next(error); }
});
router.post('/audio/transcript/:id/approve', validateRequest({ params: audioParamsSchema }), async (req, res, next) => {
  try { const a = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string }; res.json(await approveTranscript(String(req.params.id), a.user, a.accessToken)); } catch (error) { next(error); }
});
router.post('/audio/generate', validateBody(audioGenerateSchema), async (req, res, next) => {
  try { const a = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string }; res.status(201).json(await generateAudio(req.body, a.user, a.accessToken)); } catch (error) { next(error); }
});
router.get('/audio/:id', validateRequest({ params: audioParamsSchema }), async (req, res, next) => {
  try { const a = req as AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']>; accessToken: string }; res.json(await getAudio(String(req.params.id), a.user, a.accessToken)); } catch (error) { next(error); }
});

export default router;
