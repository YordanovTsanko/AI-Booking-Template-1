import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/format';
import BarberPole from './BarberPole';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `relative rounded-lg px-3 py-2 text-sm font-semibold uppercase tracking-wide transition ${
    isActive ? 'text-white after:absolute after:inset-x-3 after:-bottom-[1px] after:h-0.5 after:bg-linear-to-r after:from-brand-500 after:to-accent-500' : 'text-slate-400 hover:text-white'
  }`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-xl px-4 py-3 text-base font-semibold ${isActive ? 'bg-brand-600/20 text-white' : 'text-slate-300 hover:bg-white/5'}`;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="AI Booking – начало">
      <BarberPole height={26} width={12} />
      <span className="font-display text-xl font-semibold uppercase tracking-wider text-white">
        AI <span className="text-brand-500">Bar</span>
        <span className="text-accent-500">ber</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/80 backdrop-blur-xl">
      <div className="barber-stripes h-1 w-full opacity-90" aria-hidden="true" />
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
          {isAuthenticated && user ? (
            <>
              <div className="mr-1 text-right leading-tight">
                <p className="max-w-[10rem] truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
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
              <Link to="/register" className="btn-accent">
                Регистрация
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-xl p-2 text-slate-300 hover:bg-white/10 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Затвори менюто' : 'Отвори менюто'}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="animate-fade-in border-t border-white/10 bg-ink-900 md:hidden">
          <div className="container-page space-y-1 py-4">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={mobileLinkClass}>
                {l.label}
              </NavLink>
            ))}
            <div className="mt-3 border-t border-white/10 pt-3">
              {isAuthenticated && user ? (
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
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
                  <Link to="/register" className="btn-accent">
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
