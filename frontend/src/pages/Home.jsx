import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorFeedback } from '../api/axios.js';
import ServiceCard from '../components/ServiceCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import InlineFeedback from '../components/InlineFeedback.jsx';
import { SkeletonGrid } from '../components/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  { icon: '📅', title: 'Онлайн календар 24/7', text: 'Клиентите виждат реалните свободни часове и резервират за секунди – денем и нощем.' },
  { icon: '🤖', title: 'AI асистент', text: 'Напиши „искам час в петък следобед“ и асистентът ще ти предложи свободни часове.' },
  { icon: '⚡', title: 'Без двойни резервации', text: 'Системата пази всеки час и не позволява два клиента в едно и също време.' },
  { icon: '📊', title: 'Табло за собственика', text: 'Предстоящи часове, приходи и клиенти – всичко на едно място.' },
];

const BUSINESSES = ['💈 Бръснарници', '💇 Фризьорски салони', '🚗 Автомивки', '💅 Студиа за красота', '📸 Фото студиа'];

const STEPS = [
  { n: '1', title: 'Избери услуга', text: 'Разгледай услугите, цените и продължителността.' },
  { n: '2', title: 'Избери служител и час', text: 'Виж свободните часове в календара и избери удобен.' },
  { n: '3', title: 'Потвърди', text: 'Готово! Резервацията се появява в таблото ти.' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/services', { params: { limit: 6, sort: 'newest' } })
      .then((res) => setServices(res.data.data || []))
      .catch((err) => setError(getErrorFeedback(err).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-purple-50" />
        <div className="absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 -z-10 h-96 w-96 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="container-page grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <span className="badge bg-brand-100 text-brand-700">✨ Резервации с изкуствен интелект</span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Запази час за секунди. <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">Без обаждания.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Избери услуга, служител и удобен час от календара – или просто кажи на AI асистента кога ти е удобно.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/booking" className="btn-primary px-6 py-3 text-base">
                Резервирай сега
              </Link>
              <Link to="/services" className="btn-secondary px-6 py-3 text-base">
                Разгледай услугите
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {BUSINESSES.map((b) => (
                <span key={b} className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                  {b}
                </span>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="card rotate-1 p-6">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900">Свободни часове – петък</p>
                <span className="badge bg-emerald-100 text-emerald-700">● Онлайн</span>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {['09:00', '09:30', '10:30', '11:00', '13:00', '14:30', '15:00', '16:30'].map((t, i) => (
                  <span key={t} className={`rounded-xl py-2 text-center text-sm font-semibold ${i === 5 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 p-4 text-sm text-white">
                🤖 „Намерих свободен час в петък от 14:30 при Георги. Да го запазя ли?“
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-title">Всичко, от което бизнесът ти има нужда</h2>
          <p className="mt-3 text-slate-500">Създадено за малки бизнеси, които искат повече клиенти и по-малко телефонни разговори.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 transition hover:-translate-y-0.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">{f.icon}</div>
              <h3 className="mt-4 font-bold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR SERVICES */}
      <section className="container-page py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="section-title">Популярни услуги</h2>
            <p className="mt-2 text-slate-500">Избери услуга и запази час директно онлайн.</p>
          </div>
          <Link to="/services" className="btn-secondary">
            Виж всички →
          </Link>
        </div>

        <div className="mt-8">
          {loading && <SkeletonGrid count={3} />}
          {!loading && error && (
            <InlineFeedback type="error" message={error}>
              <button type="button" onClick={load} className="mt-2 text-sm font-semibold underline">
                Опитай отново
              </button>
            </InlineFeedback>
          )}
          {!loading && !error && services.length === 0 && (
            <EmptyState description="Все още няма добавени услуги. Влез като администратор, за да добавиш първата." actionLabel="Към управлението" actionTo="/admin/services" />
          )}
          {!loading && !error && services.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <ServiceCard key={s._id} service={s} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-page py-16">
        <h2 className="section-title text-center">Как работи?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card relative p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{s.n}</span>
              <h3 className="mt-4 font-bold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-purple-600 px-6 py-12 text-center text-white shadow-xl sm:px-12">
          <h2 className="text-3xl font-extrabold tracking-tight">Готов ли си за следващия си час?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">Регистрацията отнема под минута. Резервацията – още по-малко.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/booking" className="btn bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50">
              Резервирай час
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10">
                Създай профил
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
