import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LABELS } from '../utils/format.js';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;

const mobileLinkClass = ({ isActive }) =>
  `block rounded-xl px-4 py-3 text-base font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'}`;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="AI Booking – начало">
      <img src="/favicon.svg" alt="" className="h-9 w-9" />
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        AI<span className="text-brand-600">Booking</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();

  // Close mobile menu on navigation
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
  };

  const links = [
    { to: '/', label: 'Начало', end: true },
    { to: '/services', label: 'Услуги' },
    { to: '/booking', label: 'Резервирай' },
    ...(isAuthenticated ? [{ to: '/dashboard', label: 'Табло' }] : []),
    ...(isAdmin ? [{ to: '/admin/services', label: 'Управление' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg">
      <nav className="container-page flex h-16 items-center justify-between gap-4" aria-label="Основна навигация">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <div className="mr-1 text-right leading-tight">
                <p className="max-w-[10rem] truncate text-sm font-semibold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role] || ''}</p>
              </div>
              <button type="button" onClick={handleLogout} className="btn-secondary" disabled={loggingOut}>
                {loggingOut ? 'Зарежда...' : 'Изход'}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Вход
              </Link>
              <Link to="/register" className="btn-primary">
                Регистрация
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Затвори менюто' : 'Отвори менюто'}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="animate-fade-in border-t border-slate-200 bg-white md:hidden">
          <div className="container-page space-y-1 py-4">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={mobileLinkClass}>
                {l.label}
              </NavLink>
            ))}
            <div className="mt-3 border-t border-slate-100 pt-3">
              {isAuthenticated ? (
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role] || ''}</p>
                  </div>
                  <button type="button" onClick={handleLogout} className="btn-secondary" disabled={loggingOut}>
                    {loggingOut ? 'Зарежда...' : 'Изход'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" className="btn-secondary">
                    Вход
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
