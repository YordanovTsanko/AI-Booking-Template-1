import { Link } from 'react-router-dom';
import { Logo } from './Navbar.jsx';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-slate-500">
            Онлайн резервации с AI асистент за бръснарници, салони за красота, автомивки и фото студиа. Без телефонни обаждания, без чакане.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Навигация</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/services" className="hover:text-brand-600">Услуги</Link></li>
            <li><Link to="/booking" className="hover:text-brand-600">Резервирай час</Link></li>
            <li><Link to="/dashboard" className="hover:text-brand-600">Моето табло</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Профил</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/login" className="hover:text-brand-600">Вход</Link></li>
            <li><Link to="/register" className="hover:text-brand-600">Регистрация</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-400 sm:flex-row">
          <p>© {year} AI Booking. Всички права запазени.</p>
          <p>Създадено с ❤️ и малко изкуствен интелект</p>
        </div>
      </div>
    </footer>
  );
}
