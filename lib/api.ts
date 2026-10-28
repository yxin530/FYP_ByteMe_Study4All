import { clearSession, getSession, type AuthSession, type AuthUser } from './sessionStore';

function getApiUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
}

export class ApiClientError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type SessionExpiryHandler = () => void;
let sessionExpiryHandler: SessionExpiryHandler | null = null;

export function registerSessionExpiryHandler(handler: SessionExpiryHandler | null) {
  sessionExpiryHandler = handler;
}

export interface ApiResponseError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (requiresAuth) {
    const session = await getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    throw new ApiClientError(
      0,
      'NETWORK_ERROR',
      networkErr?.message || 'Unable to connect to the Study4All API server.',
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  const rawText = await response.text();
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { error: { message: rawText } };
  }

  if (!response.ok) {
    const errorCode = data?.error?.code ?? (response.status === 404 ? 'NOT_FOUND' : 'API_ERROR');
    const errorMessage = data?.error?.message ?? `Request failed with status ${response.status}`;
    const errorDetails = data?.error?.details;
    const requestId = data?.requestId;

    // Detect session expiry or unauthenticated rejection on protected route
    if (
      requiresAuth &&
      response.status === 401 &&
      (errorCode === 'INVALID_ACCESS_TOKEN' || errorCode === 'AUTHENTICATION_REQUIRED')
    ) {
      if (sessionExpiryHandler) {
        sessionExpiryHandler();
      }
    }

    throw new ApiClientError(
      response.status,
      errorCode,
      errorMessage,
      errorDetails,
      requestId,
    );
  }

  return data as T;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
  level?: string;
}

export interface ForgotPasswordParams {
  email: string;
}

export interface AuthSessionResponse {
  session: {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    user?: {
      id?: string;
      email?: string;
      user_metadata?: {
        full_name?: string;
        academic_level?: string;
      };
    };
  };
}

export const authApi = {
  login: async (credentials: LoginParams): Promise<AuthSession> => {
    const res = await request<AuthSessionResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      },
      false,
    );

    const s = res.session;
    const user: AuthUser | undefined = s.user?.id
      ? {
          id: s.user.id,
          email: s.user.email ?? credentials.email,
          name: s.user.user_metadata?.full_name ?? credentials.email.split('@')[0],
          level: s.user.user_metadata?.academic_level,
        }
      : undefined;

    return {
      access_token: s.access_token ?? '',
      refresh_token: s.refresh_token,
      token_type: s.token_type,
      expires_in: s.expires_in,
      user,
    };
  },

  register: async (params: RegisterParams): Promise<AuthSession> => {
    const res = await request<AuthSessionResponse>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(params),
      },
      false,
    );

    const s = res.session;
    const user: AuthUser | undefined = s.user?.id
      ? {
          id: s.user.id,
          email: s.user.email ?? params.email,
          name: s.user.user_metadata?.full_name ?? params.name,
          level: s.user.user_metadata?.academic_level ?? params.level,
        }
      : undefined;

    return {
      access_token: s.access_token ?? '',
      refresh_token: s.refresh_token,
      token_type: s.token_type,
      expires_in: s.expires_in,
      user,
    };
  },

  forgotPassword: async (params: ForgotPasswordParams): Promise<{ status: string }> => {
    return request<{ status: string }>(
      '/api/auth/forgot',
      {
        method: 'POST',
        body: JSON.stringify(params),
      },
      false,
    );
  },

  logout: async (): Promise<void> => {
    try {
      await request<{ status: string }>(
        '/api/auth/logout',
        { method: 'POST' },
        true,
      );
    } catch {
      // Ignore network error on logout
    } finally {
      await clearSession();
    }
  },
};

export interface MaterialItem {
  id: string;
  user_id: string;
  title: string;
  subject_id?: string;
  material_type: string;
  processing_status: 'pending' | 'processing' | 'ready' | 'failed';
  version_hash?: string | null;
  storage_path?: string | null;
  extracted_text?: string | null;
  processing_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMaterialParams {
  title: string;
  fileType: 'pdf' | 'image' | 'text' | 'doc';
  fileName?: string;
  subject?: string;
  content?: string;
}

export interface UploadBinaryParams {
  fileName: string;
  mimeType?: string;
  dataBase64: string;
}

export const materialsApi = {
  list: async (): Promise<MaterialItem[]> => {
    const res = await request<{ materials: MaterialItem[] }>('/api/materials', { method: 'GET' });
    return res.materials;
  },
  get: async (id: string): Promise<MaterialItem> => {
    const res = await request<{ material: MaterialItem }>(`/api/materials/${id}`, { method: 'GET' });
    return res.material;
  },
  create: async (params: CreateMaterialParams): Promise<MaterialItem> => {
    const res = await request<{ material: MaterialItem }>('/api/materials', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return res.material;
  },
  uploadBinary: async (id: string, params: UploadBinaryParams): Promise<MaterialItem> => {
    const res = await request<{ material: MaterialItem }>(`/api/materials/${id}/upload`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return res.material;
  },
  getUploadUrl: async (id: string, fileName: string): Promise<{ uploadUrl: string; storagePath: string }> => {
    return request<{ uploadUrl: string; storagePath: string }>(`/api/materials/${id}/upload-url`, {
      method: 'POST',
      body: JSON.stringify({ fileName }),
    });
  },
  getDownloadUrl: async (id: string): Promise<{ downloadUrl: string; expiresIn: number }> => {
    return request<{ downloadUrl: string; expiresIn: number }>(`/api/materials/${id}/download-url`, {
      method: 'GET',
    });
  },
  process: async (id: string): Promise<MaterialItem> => {
    const res = await request<{ material: MaterialItem }>(`/api/materials/${id}/process`, {
      method: 'POST',
    });
    return res.material;
  },
  delete: async (id: string): Promise<void> => {
    await request<void>(`/api/materials/${id}`, {
      method: 'DELETE',
    });
  },
};

export const agentApi = {
  createAudioTranscript: (requestText: string, materialIds: string[]) =>
    request<{ transcript: string }>('/api/audio/transcript', {
      method: 'POST',
      body: JSON.stringify({ requestText, materialIds }),
    }),
};

export type TutorMessage = { id: string; role: 'user' | 'assistant'; content: string };
export type TutorChatRequest = { message: string; materialIds: string[]; context: string };
export type TutorChatResponse = { message: TutorMessage };

export const tutorApi = {
  sendMessage: async (req: TutorChatRequest): Promise<TutorChatResponse> => {
    if (process.env.EXPO_PUBLIC_TUTOR_API_ENABLED !== 'true') {
      return {
        message: {
          id: `local-${Date.now()}`,
          role: 'assistant',
          content: 'Your tutor connection is ready. Add the tutor API to start a grounded lesson.',
        },
      };
    }
    return request<TutorChatResponse>('/api/tutor/chat', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },
};
