import type { NextFunction, Request, Response as ExpressResponse } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../errors/apiError.js';

export type AuthenticatedUser = {
  id: string;
  email?: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
  accessToken?: string;
};

function bearerToken(req: Request): string | undefined {
  const header = req.header('authorization');
  if (!header) return undefined;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
}

async function verifyWithSupabase(token: string): Promise<AuthenticatedUser> {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new ApiError(
      503,
      'AUTH_PROVIDER_NOT_CONFIGURED',
      'Supabase authentication is not configured on the backend yet.',
    );
  }

  let response: globalThis.Response;
  try {
    response = await fetch(`${env.supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      headers: {
        apikey: env.supabaseAnonKey,
        authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new ApiError(503, 'AUTH_PROVIDER_UNAVAILABLE', 'The authentication provider is unavailable.');
  }

  if (!response.ok) {
    throw new ApiError(401, 'INVALID_ACCESS_TOKEN', 'The access token is invalid or expired.');
  }

  const user = (await response.json()) as { id?: unknown; email?: unknown };
  if (typeof user.id !== 'string' || user.id.length === 0) {
    throw new ApiError(401, 'INVALID_AUTH_RESPONSE', 'The authentication provider returned an invalid user.');
  }

  return {
    id: user.id,
    ...(typeof user.email === 'string' ? { email: user.email } : {}),
  };
}

export async function requireAuth(req: AuthenticatedRequest, _res: ExpressResponse, next: NextFunction) {
  const token = bearerToken(req);
  if (!token) {
    next(new ApiError(401, 'AUTHENTICATION_REQUIRED', 'A Bearer access token is required.'));
    return;
  }

  try {
    req.accessToken = token;
    req.user = await verifyWithSupabase(token);
    next();
  } catch (error) {
    next(error);
  }
}
