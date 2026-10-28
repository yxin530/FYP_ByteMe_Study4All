import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  saveSession,
  getSession,
  clearSession,
  isSessionExpired,
  type AuthSession,
} from '../lib/sessionStore';
import {
  authApi,
  ApiClientError,
  registerSessionExpiryHandler,
} from '../lib/api';

test('sessionStore saves, retrieves, and clears auth sessions', async () => {
  await clearSession();

  const testSession: AuthSession = {
    access_token: 'test_token_abc_123',
    refresh_token: 'refresh_xyz_456',
    expires_in: 3600,
    user: {
      id: 'student_uuid_01',
      name: 'Aina Rahman',
      email: 'aina@student.edu.my',
      level: 'Undergraduate',
    },
  };

  await saveSession(testSession);
  const retrieved = await getSession();

  assert.ok(retrieved);
  assert.equal(retrieved.access_token, 'test_token_abc_123');
  assert.equal(retrieved.refresh_token, 'refresh_xyz_456');
  assert.equal(retrieved.user?.id, 'student_uuid_01');
  assert.equal(retrieved.user?.name, 'Aina Rahman');
  assert.ok(typeof retrieved.expires_at === 'number');

  await clearSession();
  const cleared = await getSession();
  assert.equal(cleared, null);
});

test('isSessionExpired correctly detects expired and valid sessions', () => {
  const futureSession: AuthSession = {
    access_token: 'valid_token',
    expires_at: Date.now() + 600_000, // 10 minutes in future
  };
  assert.equal(isSessionExpired(futureSession), false);

  const pastSession: AuthSession = {
    access_token: 'expired_token',
    expires_at: Date.now() - 60_000, // 1 minute in past
  };
  assert.equal(isSessionExpired(pastSession), true);

  const nearExpirySession: AuthSession = {
    access_token: 'near_expiry_token',
    expires_at: Date.now() + 15_000, // 15 seconds in future (under 30s buffer)
  };
  assert.equal(isSessionExpired(nearExpirySession), true);
});

test('ApiClientError carries status code, code, details and message', () => {
  const error = new ApiClientError(
    400,
    'VALIDATION_ERROR',
    'Request validation failed',
    [{ path: 'email', message: 'A valid email address is required' }],
    'req-12345',
  );

  assert.equal(error.statusCode, 400);
  assert.equal(error.code, 'VALIDATION_ERROR');
  assert.equal(error.message, 'Request validation failed');
  assert.equal(error.requestId, 'req-12345');
  assert.deepEqual(error.details, [
    { path: 'email', message: 'A valid email address is required' },
  ]);
});

test('authApi connects to mock backend and parses sessions', async () => {
  let capturedLoginBody: any = null;
  let capturedRegisterBody: any = null;
  let capturedForgotBody: any = null;
  let capturedLogoutHeader: string | undefined = undefined;

  const server = createServer(async (req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    await new Promise((resolve) => req.on('end', resolve));

    if (req.url === '/api/auth/login' && req.method === 'POST') {
      capturedLoginBody = JSON.parse(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          session: {
            access_token: 'backend_access_token_mock',
            refresh_token: 'backend_refresh_token_mock',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: 'mock-user-1',
              email: capturedLoginBody.email,
              user_metadata: { full_name: 'Test Student' },
            },
          },
        }),
      );
      return;
    }

    if (req.url === '/api/auth/register' && req.method === 'POST') {
      capturedRegisterBody = JSON.parse(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          session: {
            access_token: 'new_registered_token',
            expires_in: 3600,
            user: {
              id: 'new-user-2',
              email: capturedRegisterBody.email,
              user_metadata: { full_name: capturedRegisterBody.name },
            },
          },
        }),
      );
      return;
    }

    if (req.url === '/api/auth/forgot' && req.method === 'POST') {
      capturedForgotBody = JSON.parse(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (req.url === '/api/auth/logout' && req.method === 'POST') {
      capturedLogoutHeader = req.headers['authorization'];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as any).port;
  process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${port}`;

  try {
    // 1. Test Login
    const loginSession = await authApi.login({
      email: 'student@example.edu.my',
      password: 'password123',
    });
    assert.equal(capturedLoginBody.email, 'student@example.edu.my');
    assert.equal(loginSession.access_token, 'backend_access_token_mock');
    assert.equal(loginSession.user?.name, 'Test Student');

    // 2. Test Register
    const registerSession = await authApi.register({
      name: 'New Student',
      email: 'new@example.edu.my',
      password: 'securePass123',
      level: 'Secondary',
    });
    assert.equal(capturedRegisterBody.name, 'New Student');
    assert.equal(registerSession.access_token, 'new_registered_token');

    // 3. Test Forgot Password
    const forgotResult = await authApi.forgotPassword({ email: 'recover@example.edu.my' });
    assert.equal(capturedForgotBody.email, 'recover@example.edu.my');
    assert.equal(forgotResult.status, 'ok');

    // 4. Test Logout with session
    await saveSession(loginSession);
    await authApi.logout();
    assert.equal(capturedLogoutHeader, 'Bearer backend_access_token_mock');
    const cleared = await getSession();
    assert.equal(cleared, null);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('session expiry handler triggers when receiving 401 INVALID_ACCESS_TOKEN', async () => {
  const server = createServer(async (req, res) => {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: {
          code: 'INVALID_ACCESS_TOKEN',
          message: 'The access token is invalid or expired.',
        },
      }),
    );
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as any).port;
  process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${port}`;

  let expiryTriggered = false;
  registerSessionExpiryHandler(() => {
    expiryTriggered = true;
  });

  await saveSession({ access_token: 'expired_or_invalid_token' });

  try {
    // Import and trigger agentApi.createAudioTranscript which requires auth
    const { agentApi } = await import('../lib/api');
    await assert.rejects(
      async () => {
        await agentApi.createAudioTranscript('generate lecture', ['mat1']);
      },
      (err: any) => {
        assert.ok(err instanceof ApiClientError);
        assert.equal(err.statusCode, 401);
        assert.equal(err.code, 'INVALID_ACCESS_TOKEN');
        return true;
      },
    );

    assert.equal(expiryTriggered, true, 'Expiry handler must be invoked on 401 INVALID_ACCESS_TOKEN');
  } finally {
    registerSessionExpiryHandler(null);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
