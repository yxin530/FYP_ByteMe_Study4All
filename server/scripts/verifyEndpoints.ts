import { createServer } from 'node:http';
import { app } from '../src/app.js';

interface TestResult {
  name: string;
  passed: boolean;
  expectedStatus: number;
  actualStatus: number;
  response: unknown;
}

async function runVerification() {
  console.log('=== AI Study4All Endpoint Verification ===\n');

  // Start app on ephemeral port to avoid conflicts
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to obtain server address');
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Server listening at ${baseUrl} on Node.js ${process.version}\n`);

  const results: TestResult[] = [];

  async function check(
    name: string,
    path: string,
    options: RequestInit,
    expectedStatus: number,
    validate: (res: Response, body: any) => boolean,
  ) {
    try {
      const res = await fetch(`${baseUrl}${path}`, options);
      const text = await res.text();
      let body: any;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }

      const statusMatch = res.status === expectedStatus;
      const customValidation = validate(res, body);
      const passed = statusMatch && customValidation;

      results.push({
        name,
        passed,
        expectedStatus,
        actualStatus: res.status,
        response: body,
      });

      const icon = passed ? '✅' : '❌';
      console.log(`${icon} [${res.status}] ${name}`);
      if (!passed) {
        console.error(`   Expected: ${expectedStatus}, Got: ${res.status}`);
        console.error('   Body:', body);
      }
    } catch (err: any) {
      results.push({
        name,
        passed: false,
        expectedStatus,
        actualStatus: 0,
        response: err.message,
      });
      console.log(`❌ [ERROR] ${name}: ${err.message}`);
    }
  }

  // 1. Health check
  await check(
    'GET /health returns 200 with service info',
    '/health',
    { method: 'GET' },
    200,
    (res, body) =>
      body?.status === 'ok' &&
      body?.service === 'study4all-api' &&
      Boolean(res.headers.get('x-request-id')),
  );

  // 2. Custom request ID preservation
  await check(
    'Request preserves client-provided x-request-id',
    '/health',
    { method: 'GET', headers: { 'x-request-id': 'client-custom-req-123' } },
    200,
    (res, body) => res.headers.get('x-request-id') === 'client-custom-req-123',
  );

  // 3. Route not found
  await check(
    'GET /nonexistent returns 404 ROUTE_NOT_FOUND',
    '/nonexistent',
    { method: 'GET' },
    404,
    (_res, body) => body?.error?.code === 'ROUTE_NOT_FOUND',
  );

  // 4. Malformed JSON
  await check(
    'POST /api/auth/login with malformed JSON returns 400 MALFORMED_JSON',
    '/api/auth/login',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"email": "broken',
    },
    400,
    (_res, body) => body?.error?.code === 'MALFORMED_JSON',
  );

  // 5. Schema validation error on missing/invalid fields
  await check(
    'POST /api/auth/login with invalid email returns 400 VALIDATION_ERROR',
    '/api/auth/login',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: '123' }),
    },
    400,
    (_res, body) =>
      body?.error?.code === 'VALIDATION_ERROR' &&
      Array.isArray(body?.error?.details) &&
      body.error.details.length > 0,
  );

  // 6. Valid auth request returns 501 FEATURE_NOT_IMPLEMENTED
  await check(
    'POST /api/auth/login with valid body returns 501 FEATURE_NOT_IMPLEMENTED',
    '/api/auth/login',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    },
    501,
    (_res, body) => body?.error?.code === 'FEATURE_NOT_IMPLEMENTED',
  );

  // 7. Grounded explanation validation: rejects ungrounded request (missing materialIds)
  await check(
    'POST /api/learn/explain without materialIds returns 400 VALIDATION_ERROR',
    '/api/learn/explain',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'Explain osmosis' }),
    },
    400,
    (_res, body) => body?.error?.code === 'VALIDATION_ERROR',
  );

  // 8. Grounded explanation validation: accepts valid grounded request payload
  await check(
    'POST /api/learn/explain with valid materialIds returns 501 FEATURE_NOT_IMPLEMENTED',
    '/api/learn/explain',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: 'Explain osmosis',
        materialIds: ['mat_biology_01'],
        responseFormat: 'concise',
      }),
    },
    501,
    (_res, body) => body?.error?.code === 'FEATURE_NOT_IMPLEMENTED',
  );

  // 9. Audio retrieval route parameter validation
  await check(
    'GET /api/audio/:id returns 501 FEATURE_NOT_IMPLEMENTED',
    '/api/audio/audio_uuid_123',
    { method: 'GET' },
    501,
    (_res, body) => body?.error?.code === 'FEATURE_NOT_IMPLEMENTED',
  );

  // Shutdown server
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );

  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\nVerification Summary: ${passedCount}/${results.length} checks passed.\n`);

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Verification failed unexpectedly:', err);
  process.exit(1);
});

