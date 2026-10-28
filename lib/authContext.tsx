import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  clearSession,
  getSession,
  isSessionExpired,
  saveSession,
  type AuthSession,
  type AuthUser,
} from './sessionStore';
import {
  authApi,
  registerSessionExpiryHandler,
  type LoginParams,
  type RegisterParams,
} from './api';

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  login: (credentials: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ status: string }>;
  logout: () => Promise<void>;
  loginDemo: () => Promise<void>;
  dismissSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Initialize session from secure storage
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const stored = await getSession();
        if (stored && isSessionExpired(stored)) {
          await clearSession();
          if (mounted) {
            setSession(null);
            setSessionExpired(true);
          }
        } else if (mounted) {
          setSession(stored);
        }
      } catch {
        if (mounted) setSession(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initSession();

    // Register 401 callback from api.ts
    registerSessionExpiryHandler(async () => {
      await clearSession();
      if (mounted) {
        setSession(null);
        setSessionExpired(true);
      }
    });

    return () => {
      mounted = false;
      registerSessionExpiryHandler(null);
    };
  }, []);

  const login = async (credentials: LoginParams): Promise<void> => {
    const newSession = await authApi.login(credentials);
    await saveSession(newSession);
    setSession(newSession);
    setSessionExpired(false);
  };

  const register = async (params: RegisterParams): Promise<void> => {
    const newSession = await authApi.register(params);
    await saveSession(newSession);
    setSession(newSession);
    setSessionExpired(false);
  };

  const forgotPassword = async (email: string): Promise<{ status: string }> => {
    return await authApi.forgotPassword({ email });
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      await clearSession();
      setSession(null);
      setSessionExpired(false);
    }
  };

  const loginDemo = async (): Promise<void> => {
    const demoSession: AuthSession = {
      access_token: 'demo-student-token-aina',
      expires_in: 86400 * 7,
      user: {
        id: 'demo-student-aina',
        name: 'Aina Rahman',
        email: 'aina.rahman@student.edu.my',
        level: 'Undergraduate',
      },
    };
    await saveSession(demoSession);
    setSession(demoSession);
    setSessionExpired(false);
  };

  const dismissSessionExpired = () => {
    setSessionExpired(false);
  };

  const user = session?.user ?? null;
  const isAuthenticated = Boolean(session?.access_token);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isAuthenticated,
        sessionExpired,
        login,
        register,
        forgotPassword,
        logout,
        loginDemo,
        dismissSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

