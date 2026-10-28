import { env } from '../config/env.js';
import { ApiError } from '../errors/apiError.js';
import type { ForgotPasswordInput, LoginInput, RegisterInput } from '../schemas/authSchemas.js';

type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: { id?: string; email?: string };
  message?: string;
  msg?: string;
  error_description?: string;
};

function authUrl(path: string): string {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new ApiError(503, 'AUTH_PROVIDER_NOT_CONFIGURED', 'Supabase authentication is not configured on the backend yet.');
  }
  return `${env.supabaseUrl.replace(/\/$/, '')}/auth/v1${path}`;
}

async function supabaseAuthRequest(path: string, body: Record<string, unknown>): Promise<SupabaseAuthResponse> {
  let response: Response;
  try {
    response = await fetch(authUrl(path), {
      method: 'POST',
      headers: {
        apikey: env.supabaseAnonKey!,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(503, 'AUTH_PROVIDER_UNAVAILABLE', 'The authentication provider is unavailable.');
  }

  const payload = (await response.json().catch(() => ({}))) as SupabaseAuthResponse;
  if (!response.ok) {
    throw new ApiError(response.status === 400 ? 401 : 502, 'AUTH_PROVIDER_ERROR', payload.error_description ?? payload.message ?? payload.msg ?? 'Authentication failed.');
  }
  return payload;
}

export function login(input: LoginInput) {
  return supabaseAuthRequest('/token?grant_type=password', input);
}

export function register(input: RegisterInput) {
  return supabaseAuthRequest('/signup', {
    email: input.email,
    password: input.password,
    data: { full_name: input.name, academic_level: input.level },
  });
}

export function requestPasswordReset(input: ForgotPasswordInput) {
  return supabaseAuthRequest('/recover', { email: input.email });
}

export async function logout(accessToken?: string): Promise<void> {
  if (!accessToken || !env.supabaseUrl || !env.supabaseAnonKey) {
    return;
  }
  try {
    await fetch(authUrl('/logout'), {
      method: 'POST',
      headers: {
        apikey: env.supabaseAnonKey,
        authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    // Graceful logout if network fails or provider is unavailable
  }
}
