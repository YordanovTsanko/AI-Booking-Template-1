import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { tokenStorage, getErrorFeedback } from '../api/axios';
import type { ApiResponse, AuthPayload, User } from '../types';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  name: string;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  checking: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isClient: boolean;
  login: (credentials: LoginInput) => Promise<ApiResponse<AuthPayload>>;
  register: (payload: RegisterInput) => Promise<ApiResponse<AuthPayload>>;
  logout: () => Promise<void>;
}

interface LogoutEventDetail {
  message?: string;
  redirect?: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(() => (tokenStorage.get() ? tokenStorage.getUser() : null));
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [checking, setChecking] = useState<boolean>(() => Boolean(tokenStorage.get()));

  // Refresh the user from the server on startup
  useEffect(() => {
    let cancelled = false;
    if (!tokenStorage.get()) {
      setChecking(false);
      return undefined;
    }
    api
      .get<ApiResponse<{ user: User }>>('/auth/me', { skipGlobalHandler: true })
      .then((res) => {
        if (cancelled) return;
        setUser(res.data.data.user);
        tokenStorage.setUser(res.data.data.user);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (getErrorFeedback(err).status === 401) {
          tokenStorage.clear();
          setUser(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback((data: AuthPayload) => {
    tokenStorage.set(data.token);
    tokenStorage.setUser(data.user);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async (credentials: LoginInput) => {
      const res = await api.post<ApiResponse<AuthPayload>>('/auth/login', credentials);
      applySession(res.data.data);
      return res.data;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload: RegisterInput) => {
      const res = await api.post<ApiResponse<AuthPayload>>('/auth/register', payload);
      applySession(res.data.data);
      return res.data;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    let message = 'Излезе успешно. Ще се видим скоро!';
    try {
      const res = await api.post<ApiResponse<null>>('/auth/logout', null, { skipGlobalHandler: true });
      message = res.data.message || message;
    } catch {
      // still log out locally
    }
    clearSession();
    navigate('/', { state: { flash: { type: 'success', message } } });
  }, [clearSession, navigate]);

  // Global 401 → clear session and send to login with the server message
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<LogoutEventDetail>).detail;
      clearSession();
      if (!detail?.redirect || location.pathname.startsWith('/login')) return;
      const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
      navigate(`/login?redirect=${redirect}`, {
        replace: true,
        state: { flash: { type: 'error', message: detail?.message || 'Сесията ти изтече. Моля, влез отново.' } },
      });
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [clearSession, location.pathname, location.search, navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      checking,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      isStaff: user?.role === 'staff',
      isClient: user?.role === 'client',
      login,
      register,
      logout,
    }),
    [user, token, checking, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
