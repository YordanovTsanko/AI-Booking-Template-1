import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { tokenStorage, getErrorFeedback } from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => (tokenStorage.get() ? tokenStorage.getUser() : null));
  const [token, setToken] = useState(() => tokenStorage.get());
  const [checking, setChecking] = useState(() => Boolean(tokenStorage.get()));

  // Refresh the user from the server on startup
  useEffect(() => {
    let cancelled = false;
    const currentToken = tokenStorage.get();
    if (!currentToken) {
      setChecking(false);
      return undefined;
    }
    api
      .get('/auth/me', { skipGlobalHandler: true })
      .then((res) => {
        if (cancelled) return;
        setUser(res.data.data.user);
        tokenStorage.setUser(res.data.data.user);
      })
      .catch((err) => {
        if (cancelled) return;
        if (getErrorFeedback(err).status === 401) {
          tokenStorage.clear();
          setUser(null);
          setToken(null);
        }
      })
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback((data) => {
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
    async (credentials) => {
      const res = await api.post('/auth/login', credentials);
      applySession(res.data.data);
      return res.data;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const res = await api.post('/auth/register', payload);
      applySession(res.data.data);
      return res.data;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    let message = 'Излезе успешно. Ще се видим скоро!';
    try {
      const res = await api.post('/auth/logout', null, { skipGlobalHandler: true });
      message = res.data.message || message;
    } catch {
      // still log out locally
    }
    clearSession();
    navigate('/', { state: { flash: { type: 'success', message } } });
  }, [clearSession, navigate]);

  // Global 401 → clear session and send to login with the server message
  useEffect(() => {
    const handler = (event) => {
      clearSession();
      if (!event.detail?.redirect) return;
      if (location.pathname.startsWith('/login')) return;
      const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
      navigate(`/login?redirect=${redirect}`, {
        replace: true,
        state: { flash: { type: 'error', message: event.detail?.message || 'Сесията ти изтече. Моля, влез отново.' } },
      });
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [clearSession, location.pathname, location.search, navigate]);

  const value = useMemo(
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
      setUser,
    }),
    [user, token, checking, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
