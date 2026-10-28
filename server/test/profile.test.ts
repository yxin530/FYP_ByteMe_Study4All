import assert from 'node:assert/strict';
import test from 'node:test';
import { getLearningProfile } from '../src/services/learningProfileService.js';
import type { AuthenticatedUser } from '../src/security/auth.js';

const mockUser: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'student@example.edu.my',
};

test('Profile flow: getLearningProfile returns insufficient_activity when no quizzes are submitted', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/rest/v1/quiz_sessions')) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  }) as typeof fetch;

  try {
    const profile = await getLearningProfile(mockUser, 'mock-jwt-token');

    assert.equal(profile.status, 'insufficient_activity');
    assert.deepEqual(profile.strengths, []);
    assert.deepEqual(profile.weakTopics, []);
    assert.deepEqual(profile.progress, []);
    assert.deepEqual(profile.recommendations, []);
    assert.equal(profile.streakDays, 0);
    assert.equal(profile.overallMastery, 0);
    assert.equal(profile.totalQuizzes, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Profile flow: getLearningProfile aggregates submitted quizzes and persists learning_profiles', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; method: string; body?: any }> = [];

  const now = new Date();
  const todayIso = now.toISOString();
  const yesterdayIso = new Date(Date.now() - 86400000).toISOString();

  const mockSessions = [
    {
      id: 'session-1',
      user_id: mockUser.id,
      subject: 'Mathematics',
      topic: 'Linear equations',
      score: 9,
      total: 10,
      created_at: todayIso,
    },
    {
      id: 'session-2',
      user_id: mockUser.id,
      subject: 'Mathematics',
      topic: 'Quadratic equations',
      score: 5,
      total: 10,
      created_at: yesterdayIso,
    },
    {
      id: 'session-3',
      user_id: mockUser.id,
      subject: 'Programming',
      topic: 'Binary search',
      score: 8,
      total: 10,
      created_at: todayIso,
    },
  ];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ url, method, body });

    if (url.includes('/rest/v1/quiz_sessions')) {
      return new Response(JSON.stringify(mockSessions), { status: 200 });
    }
    if (url.includes('/rest/v1/learning_profiles')) {
      return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  }) as typeof fetch;

  try {
    const profile = await getLearningProfile(mockUser, 'mock-jwt-token');

    assert.equal(profile.status, 'complete');
    assert.equal(profile.totalQuizzes, 3);
    assert.equal(profile.streakDays, 2); // Today and yesterday active -> 2-day streak

    // Check progress
    assert.equal(profile.progress.length, 3);
    const mathLinear = profile.progress.find((p) => p.topic === 'Linear equations');
    assert.ok(mathLinear);
    assert.equal(mathLinear.percentage, 90);
    assert.equal(mathLinear.subject, 'Mathematics');

    const mathQuad = profile.progress.find((p) => p.topic === 'Quadratic equations');
    assert.ok(mathQuad);
    assert.equal(mathQuad.percentage, 50);

    // Check strengths (>= 80%)
    assert.ok(profile.strengths.some((s) => s.topic === 'Linear equations'));
    assert.ok(profile.strengths.some((s) => s.topic === 'Binary search'));

    // Check weak topics (< 60%)
    assert.ok(profile.weakTopics.some((w) => w.topic === 'Quadratic equations'));

    // Check recommendations
    assert.ok(profile.recommendations.some((r) => r.topic === 'Quadratic equations'));

    // Check subject mastery
    assert.equal(profile.subjectMastery.length, 2);
    const mathMastery = profile.subjectMastery.find((s) => s.subject === 'Mathematics');
    assert.ok(mathMastery);
    assert.equal(mathMastery.percentage, 70); // (9 + 5) / (10 + 10) = 14/20 = 70%
    assert.equal(mathMastery.quizzesCount, 2);

    const progMastery = profile.subjectMastery.find((s) => s.subject === 'Programming');
    assert.ok(progMastery);
    assert.equal(progMastery.percentage, 80); // 8/10 = 80%
    assert.equal(progMastery.quizzesCount, 1);

    // Check overall mastery: (9 + 5 + 8) / 30 = 22 / 30 = 73%
    assert.equal(profile.overallMastery, 73);

    // Check recent quizzes
    assert.equal(profile.recentQuizzes.length, 3);
    assert.equal(profile.recentQuizzes[0].quizId, 'session-1');

    // Verify persistence to learning_profiles table
    const profilePost = requests.find((r) => r.url.includes('/rest/v1/learning_profiles') && r.method === 'POST');
    assert.ok(profilePost);
    assert.equal(profilePost.body.user_id, mockUser.id);
    assert.ok(Array.isArray(profilePost.body.strengths));
    assert.ok(Array.isArray(profilePost.body.weak_topics));
    assert.ok(Array.isArray(profilePost.body.progress));
    assert.ok(Array.isArray(profilePost.body.recommendations));
    assert.ok(Array.isArray(profilePost.body.evidence_references));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

