import assert from 'node:assert/strict';
import test from 'node:test';
import { explainSchema, tutorChatSchema } from '../src/schemas/learningSchemas.js';
import { env } from '../src/config/env.js';

test('Phase 4 learning requests require at least one material', () => {
  assert.equal(explainSchema.safeParse({ query: 'Explain this', materialIds: [] }).success, false);
  assert.equal(tutorChatSchema.safeParse({ message: 'Explain this', materialIds: [] }).success, false);
});

test('Phase 4 provider defaults to the configured real-provider path', () => {
  assert.equal(env.llmProvider, 'openai');
});
