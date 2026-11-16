import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import api from './api/axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import InlineFeedback from './components/InlineFeedback';
import AIChatWidget from './components/AIChatWidget';
import Home from './pages/Home';
import Services from './pages/Services';
import BookingPage from './pages/BookingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminServices from './pages/AdminServices';
import NotFound from './pages/NotFound';
import type { Feedback, NormalizedError } from './types';

const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 60000;

interface HealthResponse {
  success: boolean;
  status?: string;
  dbStatus?: 'connected' | 'disconnected';
}

/* =========================================================================
 *  HEALTH GATE – nothing renders until GET /api/health succeeds
 * ========================================================================= */
function HealthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (ready) return undefined;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();
    setTimedOut(false);

    const check = async () => {
      try {
        const res = await api.get<HealthResponse>('/health', { timeout: 5000, skipGlobalHandler: true, params: { t: Date.now() } });
        if (!cancelled && res.data?.success && res.data?.dbStatus === 'connected') {
          setReady(true);
          return;
        }
      } catch {
        // 503 / network error → keep waiting
      }
      if (cancelled) return;
      if (Date.now() - startedAt >= TIMEOUT_MS) setTimedOut(true);
      // keep polling in the background even after the timeout message
      timer = setTimeout(check, POLL_INTERVAL_MS);
    };

    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [attempt, ready]);

  // Block keyboard and scrolling while the server is not ready
  useEffect(() => {
    if (ready) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const blockKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isRetry = target?.closest?.('[role="alertdialog"] button');
      if (!isRetry) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', blockKeys, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', blockKeys, true);
    };
  }, [ready]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  if (!ready) return <LoadingScreen timedOut={timedOut} onRetry={retry} />;
  return <>{children}</>;
}

/* =========================================================================
 *  Global banners: offline / server down / flash messages from navigation
 * ========================================================================= */
type Flash = Feedback & { pathname: string };

function GlobalStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const [offline, setOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [networkError, setNetworkError] = useState('');
  const [flash, setFlash] = useState<Flash | null>(null);

  useEffect(() => {
    const on = () => {
      setOffline(false);
      setNetworkError('');
    };
    const off = () => setOffline(true);
    const onNetwork = (e: Event) => setNetworkError((e as CustomEvent<NormalizedError>).detail?.message || '');
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    window.addEventListener('api:network-error', onNetwork);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('api:network-error', onNetwork);
    };
  }, []);

  // Pick up flash messages passed via navigate(..., { state: { flash } }),
  // keep them while on the same page, clear them when the page changes.
  useEffect(() => {
    const state = location.state as { flash?: Feedback } | null;
    if (state?.flash) {
      setFlash({ ...state.flash, pathname: location.pathname });
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    } else {
      setFlash((f) => (f && f.pathname !== location.pathname ? null : f));
    }
  }, [location, navigate]);

  if (!offline && !networkError && !flash) return null;

  return (
    <div className="container-page space-y-2 pt-4">
      {offline && <InlineFeedback type="warning" message="Нямаш интернет връзка. Някои действия няма да работят, докато не се свържеш отново." />}
      {!offline && networkError && <InlineFeedback type="error" message={networkError} onClose={() => setNetworkError('')} />}
      {flash && <InlineFeedback type={flash.type} message={flash.message} onClose={() => setFlash(null)} />}
    </div>
  );
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  // Only redirect users who were ALREADY logged in when opening the page;
  // a fresh login/register navigates by itself (with the server message).
  const [wasAuthenticatedOnMount] = useState(isAuthenticated);
  if (wasAuthenticatedOnMount && isAuthenticated) {
    const redirect = new URLSearchParams(location.search).get('redirect');
    return <Navigate to={redirect && redirect.startsWith('/') ? redirect : '/dashboard'} replace />;
  }
  return <>{children}</>;
}

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <GlobalStatus />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route
            path="/login"
            element={
              <GuestOnly>
                <Login />
              </GuestOnly>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnly>
                <Register />
              </GuestOnly>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminServices />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  );
}

export default function App() {
  return (
    <HealthGate>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </HealthGate>
  );
}
