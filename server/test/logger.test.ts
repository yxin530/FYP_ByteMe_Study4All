import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redactSensitive } from '../src/logging/logger.js';

test('redactSensitive redacts passwords, tokens, and authorization fields', () => {
  const sensitiveInput = {
    user: 'student123',
    password: 'superSecretPassword',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    authorization: 'Bearer secret-access-token',
    nested: {
      apiKey: 'elevenlabs-secret-12345',
      safeField: 'biology notes',
    },
    list: [
      { secret: 'hidden' },
      { publicInfo: 'visible' },
    ],
  };

  const redacted = redactSensitive(sensitiveInput) as any;

  assert.equal(redacted.user, 'student123');
  assert.equal(redacted.password, '[REDACTED]');
  assert.equal(redacted.token, '[REDACTED]');
  assert.equal(redacted.authorization, '[REDACTED]');
  assert.equal(redacted.nested.apiKey, '[REDACTED]');
  assert.equal(redacted.nested.safeField, 'biology notes');
  assert.equal(redacted.list[0].secret, '[REDACTED]');
  assert.equal(redacted.list[1].publicInfo, 'visible');
});

test('redactSensitive sanitizes bearer tokens inside strings', () => {
  const rawString = 'Header was Bearer abc.def.ghi for auth';
  const sanitized = redactSensitive(rawString);
  assert.equal(sanitized, 'Header was Bearer [REDACTED] for auth');
});

