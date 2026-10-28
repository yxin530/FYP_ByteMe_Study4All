import assert from 'node:assert/strict';
import test from 'node:test';
import { generateQuizSchema, submitQuizSchema, explainQuizAnswerSchema } from '../src/schemas/quizSchemas.js';

test('Phase 5 quiz generation validates grounded quiz inputs', () => {
  assert.equal(generateQuizSchema.safeParse({ subject: 'Math', topic: 'Algebra', materialIds: ['m1'] }).success, true);
  assert.equal(generateQuizSchema.safeParse({ subject: 'Math', topic: 'Algebra', materialIds: [] }).success, false);
  assert.equal(generateQuizSchema.safeParse({ subject: 'Math', topic: 'Algebra', materialIds: ['m1'], difficulty: 'extreme' }).success, false);
});

test('Phase 5 answer submission requires quiz-owned question answers', () => {
  assert.equal(submitQuizSchema.safeParse({ quizId: 'q1', answers: [{ questionId: 'question-1', answer: 'A' }] }).success, true);
  assert.equal(submitQuizSchema.safeParse({ quizId: 'q1', answers: [] }).success, false);
  assert.equal(explainQuizAnswerSchema.safeParse({ quizId: 'q1', questionId: 'question-1' }).success, true);
});
