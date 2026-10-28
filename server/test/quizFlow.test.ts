import assert from 'node:assert/strict';
import test from 'node:test';
import { generateQuiz, submitQuiz, explainQuizAnswer } from '../src/services/quizSkill.js';
import type { AuthenticatedUser } from '../src/security/auth.js';
import type { GenerateQuizInput, SubmitQuizInput } from '../src/schemas/quizSchemas.js';

const mockUser: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'student@example.edu.my',
};

test('Quiz flow: generateQuiz persists session and questions with grounded excerpts', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; method: string; body?: any }> = [];

  const mockMaterial = {
    id: 'mat-1',
    user_id: mockUser.id,
    title: 'Calculus Notes',
    material_type: 'text',
    processing_status: 'ready',
    version_hash: 'hash-abc-123',
    extracted_text: 'The derivative of x squared is 2x. The integral of 2x is x squared plus C.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sessionId = 'session-uuid-1111';
  const questionId1 = 'question-uuid-2221';
  const questionId2 = 'question-uuid-2222';

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ url, method, body });

    // Mock material retrieval
    if (url.includes('/rest/v1/materials') && url.includes('id=eq.mat-1')) {
      return new Response(JSON.stringify([mockMaterial]), { status: 200 });
    }

    // Mock quiz_sessions insert
    if (url.includes('/rest/v1/quiz_sessions') && method === 'POST') {
      return new Response(
        JSON.stringify([
          {
            id: sessionId,
            user_id: mockUser.id,
            subject: body.subject,
            topic: body.topic,
            difficulty: body.difficulty,
            question_count: body.question_count,
            status: 'active',
          },
        ]),
        { status: 201 },
      );
    }

    // Mock quiz_questions insert
    if (url.includes('/rest/v1/quiz_questions') && method === 'POST') {
      return new Response(
        JSON.stringify([
          {
            id: questionId1,
            quiz_id: sessionId,
            question_text: body[0].question_text,
            options: body[0].options,
            correct_answer: body[0].correct_answer,
            explanation: body[0].explanation,
            difficulty: body[0].difficulty,
          },
          {
            id: questionId2,
            quiz_id: sessionId,
            question_text: body[1].question_text,
            options: body[1].options,
            correct_answer: body[1].correct_answer,
            explanation: body[1].explanation,
            difficulty: body[1].difficulty,
          },
        ]),
        { status: 201 },
      );
    }

    return new Response(JSON.stringify([]), { status: 200 });
  }) as typeof fetch;

  try {
    const input: GenerateQuizInput = {
      subject: 'Mathematics',
      topic: 'Calculus',
      materialIds: ['mat-1'],
      difficulty: 'medium',
      questionCount: 2,
    };

    const result = await generateQuiz(input, mockUser, 'mock-jwt-token');

    assert.equal(result.quizId, sessionId);
    assert.equal(result.subject, 'Mathematics');
    assert.equal(result.topic, 'Calculus');
    assert.equal(result.difficulty, 'medium');
    assert.equal(result.status, 'active');
    assert.equal(result.questions.length, 2);
    assert.equal(result.questions[0].id, questionId1);
    assert.equal(result.questions[1].id, questionId2);
    assert.ok(result.questions[0].options.length >= 2);
    assert.ok(result.sourceReferences.length > 0);

    // Verify database calls
    const sessionPost = requests.find((r) => r.url.includes('/rest/v1/quiz_sessions') && r.method === 'POST');
    assert.ok(sessionPost);
    assert.equal(sessionPost.body.user_id, mockUser.id);
    assert.equal(sessionPost.body.subject, 'Mathematics');
    assert.equal(sessionPost.body.difficulty, 'medium');

    const questionsPost = requests.find((r) => r.url.includes('/rest/v1/quiz_questions') && r.method === 'POST');
    assert.ok(questionsPost);
    assert.equal(questionsPost.body.length, 2);
    assert.equal(questionsPost.body[0].quiz_id, sessionId);
    assert.equal(questionsPost.body[0].user_id, mockUser.id);
    assert.ok(questionsPost.body[0].correct_answer.includes('derivative'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Quiz flow: submitQuiz records answers and calculates score and difficulty progression', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; method: string; body?: any }> = [];

  const sessionId = 'session-uuid-1111';
  const questionId1 = 'question-uuid-2221';
  const questionId2 = 'question-uuid-2222';
  const correctAnswer1 = 'The derivative of x squared is 2x';
  const correctAnswer2 = 'The integral of 2x is x squared plus C';

  const storedQuestions = [
    {
      id: questionId1,
      quiz_id: sessionId,
      question_text: 'Question 1',
      options: [correctAnswer1, 'Distractor 1', 'Distractor 2'],
      correct_answer: correctAnswer1,
      explanation: 'Explanation 1',
      difficulty: 'medium',
    },
    {
      id: questionId2,
      quiz_id: sessionId,
      question_text: 'Question 2',
      options: [correctAnswer2, 'Distractor 1', 'Distractor 2'],
      correct_answer: correctAnswer2,
      explanation: 'Explanation 2',
      difficulty: 'medium',
    },
  ];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ url, method, body });

    // Fetch questions for submission check
    if (url.includes('/rest/v1/quiz_questions?quiz_id=eq.')) {
      return new Response(JSON.stringify(storedQuestions), { status: 200 });
    }

    // Upsert quiz answers
    if (url.includes('/rest/v1/quiz_answers')) {
      return new Response(JSON.stringify(body), { status: 201 });
    }

    // Fetch quiz session difficulty
    if (url.includes('/rest/v1/quiz_sessions?id=eq.') && method === 'GET') {
      return new Response(JSON.stringify([{ difficulty: 'medium' }]), { status: 200 });
    }

    // Update quiz session status
    if (url.includes('/rest/v1/quiz_sessions?id=eq.') && method === 'PATCH') {
      return new Response(JSON.stringify({ status: 'submitted' }), { status: 200 });
    }

    return new Response(JSON.stringify([]), { status: 200 });
  }) as typeof fetch;

  try {
    // Case 1: 100% score (2/2 correct) on medium difficulty -> recommended difficulty advances to 'hard'
    const input: SubmitQuizInput = {
      quizId: sessionId,
      answers: [
        { questionId: questionId1, answer: correctAnswer1 },
        { questionId: questionId2, answer: correctAnswer2 },
      ],
    };

    const submission = await submitQuiz(input, mockUser, 'mock-jwt-token');

    assert.equal(submission.quizId, sessionId);
    assert.equal(submission.score, 2);
    assert.equal(submission.total, 2);
    assert.equal(submission.percentage, 100);
    assert.equal(submission.recommendedDifficulty, 'hard');
    assert.equal(submission.status, 'submitted');

    // Confirm answers row insertion was performed
    const answersCall = requests.find((r) => r.url.includes('/rest/v1/quiz_answers') && r.method === 'POST');
    assert.ok(answersCall);
    assert.equal(answersCall.body.length, 2);
    assert.equal(answersCall.body[0].is_correct, true);
    assert.equal(answersCall.body[1].is_correct, true);

    // Confirm quiz session status update
    const sessionPatch = requests.find((r) => r.url.includes('/rest/v1/quiz_sessions') && r.method === 'PATCH');
    assert.ok(sessionPatch);
    assert.equal(sessionPatch.body.status, 'submitted');
    assert.equal(sessionPatch.body.score, 2);
    assert.equal(sessionPatch.body.total, 2);
    assert.ok(sessionPatch.body.submitted_at);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Quiz flow: submitQuiz reduces difficulty on low score (<50%)', async () => {
  const originalFetch = globalThis.fetch;

  const sessionId = 'session-uuid-1111';
  const questionId1 = 'question-uuid-2221';
  const questionId2 = 'question-uuid-2222';
  const correctAnswer1 = 'Answer 1';
  const correctAnswer2 = 'Answer 2';

  const storedQuestions = [
    {
      id: questionId1,
      quiz_id: sessionId,
      question_text: 'Q1',
      correct_answer: correctAnswer1,
      difficulty: 'hard',
    },
    {
      id: questionId2,
      quiz_id: sessionId,
      question_text: 'Q2',
      correct_answer: correctAnswer2,
      difficulty: 'hard',
    },
  ];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;

    if (url.includes('/rest/v1/quiz_questions?quiz_id=eq.')) {
      return new Response(JSON.stringify(storedQuestions), { status: 200 });
    }
    if (url.includes('/rest/v1/quiz_answers')) {
      return new Response(JSON.stringify(body), { status: 201 });
    }
    if (url.includes('/rest/v1/quiz_sessions?id=eq.') && method === 'GET') {
      return new Response(JSON.stringify([{ difficulty: 'hard' }]), { status: 200 });
    }
    if (url.includes('/rest/v1/quiz_sessions?id=eq.') && method === 'PATCH') {
      return new Response(JSON.stringify({ status: 'submitted' }), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  }) as typeof fetch;

  try {
    // 0/2 correct answers (0% < 50%) on hard difficulty -> recommended difficulty lowers to 'medium'
    const input: SubmitQuizInput = {
      quizId: sessionId,
      answers: [
        { questionId: questionId1, answer: 'Wrong choice' },
        { questionId: questionId2, answer: 'Wrong choice' },
      ],
    };

    const submission = await submitQuiz(input, mockUser, 'mock-jwt-token');

    assert.equal(submission.score, 0);
    assert.equal(submission.total, 2);
    assert.equal(submission.percentage, 0);
    assert.equal(submission.recommendedDifficulty, 'medium');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Quiz flow: explainQuizAnswer returns grounded explanation and correct answer', async () => {
  const originalFetch = globalThis.fetch;

  const sessionId = 'session-uuid-1111';
  const questionId = 'question-uuid-2221';
  const expectedAnswer = 'The derivative of x squared is 2x';
  const expectedExplanation = 'This answer is supported by the referenced passage: The derivative of x squared is 2x';
  const expectedSources = [{ materialId: 'mat-1', title: 'Calculus Notes', excerpt: 'The derivative of x squared is 2x' }];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes(`/rest/v1/quiz_questions?id=eq.${questionId}`)) {
      return new Response(
        JSON.stringify([
          {
            id: questionId,
            quiz_id: sessionId,
            question_text: 'What is the derivative?',
            correct_answer: expectedAnswer,
            explanation: expectedExplanation,
            source_references: expectedSources,
          },
        ]),
        { status: 200 },
      );
    }
    return new Response(JSON.stringify([]), { status: 404 });
  }) as typeof fetch;

  try {
    const result = await explainQuizAnswer(sessionId, questionId, mockUser, 'mock-jwt-token');

    assert.equal(result.questionId, questionId);
    assert.equal(result.correctAnswer, expectedAnswer);
    assert.equal(result.explanation, expectedExplanation);
    assert.deepEqual(result.sourceReferences, expectedSources);
    assert.equal(result.status, 'complete');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
