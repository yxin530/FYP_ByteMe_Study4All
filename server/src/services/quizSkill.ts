import { ApiError } from '../errors/apiError.js';
import type { AuthenticatedUser } from '../security/auth.js';
import type { GenerateQuizInput, SubmitQuizInput } from '../schemas/quizSchemas.js';
import { retrieveMaterialContext, type SourceReference } from './materialRetrievalService.js';
import { env } from '../config/env.js';

type Difficulty = 'easy' | 'medium' | 'hard';
type DbRow = Record<string, any>;

function dbHeaders(token: string) { return { apikey: env.supabaseAnonKey!, authorization: `Bearer ${token}`, 'content-type': 'application/json' }; }
async function db<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  if (!env.supabaseUrl || !env.supabaseAnonKey) throw new ApiError(503, 'DATABASE_NOT_CONFIGURED', 'Supabase database is not configured.');
  let response: Response;
  try { response = await fetch(`${env.supabaseUrl.replace(/\/$/, '')}${path}`, { ...init, headers: { ...dbHeaders(token), ...(init.headers ?? {}) } }); }
  catch { throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Supabase database service is unavailable.'); }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(502, 'DATABASE_REQUEST_FAILED', body?.message || 'The quiz operation could not be completed.', body);
  return body as T;
}

function nextDifficulty(difficulty: Difficulty, score: number): Difficulty {
  if (score >= 0.8) return difficulty === 'easy' ? 'medium' : 'hard';
  if (score < 0.5) return difficulty === 'hard' ? 'medium' : 'easy';
  return difficulty;
}

function questionFrom(source: SourceReference, index: number, difficulty: Difficulty) {
  const answer = source.excerpt.split(/[.!?]/)[0].trim() || source.excerpt;
  const distractors = ['This information is not addressed in the material.', 'The material gives a different explanation.', 'No conclusion can be drawn from the provided material.'];
  return { question_text: `According to the material, which statement best matches the selected topic?`, options: [answer, ...distractors].slice(0, 4), correct_answer: answer, explanation: `This answer is supported by the referenced passage: ${source.excerpt}`, difficulty, material_id: source.materialId, material_version_hash: source.materialVersionHash, source_references: [source], order: index };
}

export async function generateQuiz(input: GenerateQuizInput, user: AuthenticatedUser, token: string) {
  const context = await retrieveMaterialContext({ query: `${input.subject} ${input.topic}`, materialIds: input.materialIds }, user, token);
  const sources = context.flatMap((item) => item.passages);
  if (!sources.length) throw new ApiError(422, 'RELEVANT_MATERIAL_REQUIRED', 'Relevant ready material is required to generate a quiz.');
  const difficulty = input.difficulty ?? 'medium';
  const questions = Array.from({ length: input.questionCount }, (_, index) => questionFrom(sources[index % sources.length], index, difficulty));
  const sessions = await db<DbRow[]>('/rest/v1/quiz_sessions', token, { method: 'POST', headers: { prefer: 'return=representation' }, body: JSON.stringify({ user_id: user.id, subject: input.subject, topic: input.topic, difficulty, question_count: questions.length, material_ids: input.materialIds, material_version_hashes: context.map((item) => item.materialVersionHash) }) });
  const session = sessions[0];
  if (!session?.id) throw new ApiError(502, 'QUIZ_PERSIST_FAILED', 'The quiz session could not be saved.');
  const rows = await db<DbRow[]>('/rest/v1/quiz_questions', token, { method: 'POST', headers: { prefer: 'return=representation' }, body: JSON.stringify(questions.map(({ order, ...question }) => ({ ...question, options: question.options, quiz_id: session.id, user_id: user.id }))) });
  return { quizId: session.id, subject: input.subject, topic: input.topic, difficulty, questions: rows.map((row) => ({ id: row.id, question: row.question_text, options: row.options, difficulty: row.difficulty })), sourceReferences: sources, status: 'active' as const };
}

export async function submitQuiz(input: SubmitQuizInput, user: AuthenticatedUser, token: string) {
  const questions = await db<DbRow[]>(`/rest/v1/quiz_questions?quiz_id=eq.${encodeURIComponent(input.quizId)}&user_id=eq.${encodeURIComponent(user.id)}&select=*`, token);
  if (!questions.length) throw new ApiError(404, 'QUIZ_NOT_FOUND', 'The quiz could not be found.');
  const answers = input.answers.map((answer) => { const question = questions.find((item) => item.id === answer.questionId); if (!question) throw new ApiError(400, 'INVALID_QUESTION', 'One or more answers do not belong to this quiz.'); return { quiz_id: input.quizId, question_id: question.id, user_id: user.id, answer: answer.answer, is_correct: answer.answer === question.correct_answer }; });
  await db('/rest/v1/quiz_answers?on_conflict=quiz_id,question_id', token, { method: 'POST', headers: { prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(answers) });
  const score = answers.filter((answer) => answer.is_correct).length;
  const total = questions.length;
  const session = (await db<DbRow[]>(`/rest/v1/quiz_sessions?id=eq.${encodeURIComponent(input.quizId)}&user_id=eq.${encodeURIComponent(user.id)}&select=difficulty`, token))[0];
  const recommendedDifficulty = nextDifficulty(session?.difficulty ?? 'medium', score / total);
  await db(`/rest/v1/quiz_sessions?id=eq.${encodeURIComponent(input.quizId)}&user_id=eq.${encodeURIComponent(user.id)}`, token, { method: 'PATCH', body: JSON.stringify({ status: 'submitted', score, total, submitted_at: new Date().toISOString() }) });
  return { quizId: input.quizId, score, total, percentage: Math.round((score / total) * 100), recommendedDifficulty, status: 'submitted' as const };
}

export async function explainQuizAnswer(quizId: string, questionId: string, user: AuthenticatedUser, token: string) {
  const rows = await db<DbRow[]>(`/rest/v1/quiz_questions?id=eq.${encodeURIComponent(questionId)}&quiz_id=eq.${encodeURIComponent(quizId)}&user_id=eq.${encodeURIComponent(user.id)}&select=*`, token);
  const question = rows[0];
  if (!question) throw new ApiError(404, 'QUESTION_NOT_FOUND', 'The quiz question could not be found.');
  return { questionId, explanation: question.explanation, correctAnswer: question.correct_answer, sourceReferences: question.source_references, status: 'complete' as const };
}
