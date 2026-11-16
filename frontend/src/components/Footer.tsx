import { Link } from 'react-router-dom';
import { Logo } from './Navbar';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-white/10 bg-ink-950">
      <div className="barber-stripes h-1 w-full opacity-80" aria-hidden="true" />
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-slate-400">
            Онлайн резервации с AI асистент за бръснарници и салони. Без телефонни обаждания, без чакане – само чиста визия.
          </p>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-white">Навигация</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li><Link to="/services" className="hover:text-brand-400">Услуги</Link></li>
            <li><Link to="/booking" className="hover:text-brand-400">Резервирай час</Link></li>
            <li><Link to="/dashboard" className="hover:text-brand-400">Моето табло</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-white">Профил</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li><Link to="/login" className="hover:text-brand-400">Вход</Link></li>
            <li><Link to="/register" className="hover:text-brand-400">Регистрация</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row">
          <p>© {year} AI Barber Booking. Всички права запазени.</p>
          <p>Ножица, гребен и малко изкуствен интелект ✂️</p>
        </div>
      </div>
    </footer>
  );
}
