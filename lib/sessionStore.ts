export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  level?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: number; // timestamp in milliseconds
  user?: AuthUser;
}

const SESSION_STORAGE_KEY = 'study4all_auth_session';

// In-memory fallback for non-native environments, SSR, or tests
let memoryStore: string | null = null;

type SecureStoreModule = typeof import('expo-secure-store');
let secureStoreModule: SecureStoreModule | null | false = null;

async function getSecureStore(): Promise<SecureStoreModule | null> {
  if (secureStoreModule === false) return null;
  if (secureStoreModule !== null) return secureStoreModule;

  // Browser/web environment check
  if (typeof window !== 'undefined' && typeof (window as any).document !== 'undefined') {
    secureStoreModule = false;
    return null;
  }

  try {
    const mod = await import('expo-secure-store');
    const isAvail = typeof mod.isAvailableAsync === 'function' ? await mod.isAvailableAsync() : false;
    if (isAvail) {
      secureStoreModule = mod;
      return mod;
    }
  } catch {
    // Falls back to memory or localStorage
  }

  secureStoreModule = false;
  return null;
}

export async function saveSession(session: AuthSession): Promise<void> {
  const normalizedSession: AuthSession = {
    ...session,
    expires_at:
      session.expires_at ??
      (session.expires_in ? Date.now() + session.expires_in * 1000 : undefined),
  };

  const serialized = JSON.stringify(normalizedSession);
  const store = await getSecureStore();

  if (store) {
    await store.setItemAsync(SESSION_STORAGE_KEY, serialized);
  } else if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, serialized);
  } else {
    memoryStore = serialized;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  let serialized: string | null = null;
  const store = await getSecureStore();

  if (store) {
    serialized = await store.getItemAsync(SESSION_STORAGE_KEY);
  } else if (typeof window !== 'undefined' && window.localStorage) {
    serialized = window.localStorage.getItem(SESSION_STORAGE_KEY);
  } else {
    serialized = memoryStore;
  }

  if (!serialized) return null;

  try {
    return JSON.parse(serialized) as AuthSession;
  } catch {
    await clearSession();
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const store = await getSecureStore();
  if (store) {
    await store.deleteItemAsync(SESSION_STORAGE_KEY);
  } else if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  memoryStore = null;
}

export function isSessionExpired(session: AuthSession): boolean {
  if (!session.expires_at) return false;
  // Expired if current time exceeds expires_at (with 30-second buffer)
  return Date.now() >= session.expires_at - 30_000;
}
