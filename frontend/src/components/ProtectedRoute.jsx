import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Guards routes: no token → /login, wrong role → 403 page.
 */
export default function ProtectedRoute({ children, roles }) {
  const { token, user, checking } = useAuth();
  const location = useLocation();

  if (!token) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return (
      <Navigate
        to={`/login?redirect=${redirect}`}
        replace
        state={{ flash: { type: 'info', message: 'Влез в профила си, за да продължиш.' } }}
      />
    );
  }

  if (checking && !user) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" aria-label="Зарежда..." />
      </div>
    );
  }

  if (roles?.length && user && !roles.includes(user.role)) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
        <div className="card max-w-md p-8 text-center">
          <p className="bg-gradient-to-br from-rose-500 to-amber-500 bg-clip-text text-6xl font-extrabold text-transparent">403</p>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Нямаш достъп до тази страница</h1>
          <p className="mt-2 text-sm text-slate-600">Тази секция е само за администратори. Ако мислиш, че е грешка, свържи се с нас.</p>
          <Link to="/dashboard" className="btn-primary mt-6">
            Към моето табло
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
