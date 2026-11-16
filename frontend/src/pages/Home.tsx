import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorFeedback } from '../api/axios';
import ServiceCard from '../components/ServiceCard';
import EmptyState from '../components/EmptyState';
import InlineFeedback from '../components/InlineFeedback';
import SafeImage from '../components/SafeImage';
import BarberPole from '../components/BarberPole';
import { SkeletonGrid } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { BARBER_IMAGES, GALLERY } from '../utils/images';
import type { ApiResponse, Service } from '../types';

const FEATURES = [
  { icon: '📅', title: 'Онлайн календар 24/7', text: 'Клиентите виждат реалните свободни часове и резервират за секунди – денем и нощем.' },
  { icon: '🤖', title: 'AI асистент', text: 'Напиши „искам час в петък следобед“ и асистентът ще ти предложи свободни часове.' },
  { icon: '✂️', title: 'Без двойни резервации', text: 'Системата пази всеки час – никога двама клиенти на един стол едновременно.' },
  { icon: '📊', title: 'Табло за собственика', text: 'Предстоящи часове, приходи и клиенти – всичко на едно място.' },
];

const STEPS = [
  { n: '01', title: 'Избери услуга', text: 'Подстригване, брада, комбо – виж цените и продължителността.' },
  { n: '02', title: 'Избери бръснар и час', text: 'Виж свободните часове в календара и избери удобен.' },
  { n: '03', title: 'Потвърди', text: 'Готово! Седни в стола точно навреме.' },
];

const STATS = [
  { value: '24/7', label: 'Онлайн резервации' },
  { value: '30 сек', label: 'Средно време за час' },
  { value: '0', label: 'Телефонни обаждания' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .get<ApiResponse<Service[]>>('/services', { params: { limit: 6, sort: 'newest' } })
      .then((res) => setServices(res.data.data || []))
      .catch((err: unknown) => setError(getErrorFeedback(err).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  return (
    <div>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <SafeImage src={BARBER_IMAGES.hero} alt="Бръснарница" loading="eager" className="absolute inset-0 -z-20 h-full w-full" />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-ink-950 via-ink-950/85 to-ink-950/40" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-t from-ink-900 to-transparent" aria-hidden="true" />

        <div className="container-page grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="eyebrow">💈 Бръснарница · Est. онлайн</p>
            <h1 className="mt-5 font-display text-5xl font-bold uppercase leading-[1.05] tracking-wide text-white sm:text-6xl lg:text-7xl">
              Остър стил.
              <br />
              <span className="text-brand-500">Точен</span> <span className="text-accent-500">час.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Избери услуга, бръснар и удобен час от календара – или просто кажи на AI асистента кога ти е удобно. Без обаждания, без чакане.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/booking" className="btn-accent px-7 py-3.5 text-base uppercase tracking-wider">
                Запази час
              </Link>
              <Link to="/services" className="btn-secondary px-7 py-3.5 text-base uppercase tracking-wider">
                Виж услугите
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="border-l-2 border-accent-500 pl-3">
                  <dt className="text-xs uppercase tracking-wider text-slate-400">{s.label}</dt>
                  <dd className="font-display text-2xl font-semibold text-white">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <div className="relative">
              <div className="absolute -inset-10 rounded-full bg-brand-600/25 blur-3xl" aria-hidden="true" />
              <div className="absolute -inset-10 translate-x-10 rounded-full bg-accent-600/20 blur-3xl" aria-hidden="true" />
              <BarberPole height={300} width={70} className="relative drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Защо при нас</p>
          <h2 className="section-title mt-3">Всичко за модерната бръснарница</h2>
          <p className="mt-3 text-slate-400">Създадено за бизнеси, които искат повече клиенти и по-малко телефонни разговори.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="card group p-6 transition hover:-translate-y-1 hover:border-white/20">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ring-1 ${i % 2 ? 'bg-accent-500/15 ring-accent-500/30' : 'bg-brand-500/15 ring-brand-500/30'}`}>{f.icon}</div>
              <h3 className="mt-4 font-display text-lg font-semibold uppercase tracking-wide text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR SERVICES */}
      <section className="container-page py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Ценоразпис</p>
            <h2 className="section-title mt-3">Популярни услуги</h2>
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

      {/* GALLERY */}
      <section className="container-page py-20">
        <div className="text-center">
          <p className="eyebrow">Галерия</p>
          <h2 className="section-title mt-3">Майсторство в детайла</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {GALLERY.map((img, i) => (
            <div key={img.src} className={`group relative overflow-hidden rounded-2xl ring-1 ring-white/10 ${i % 3 === 0 ? 'md:row-span-2' : ''}`}>
              <SafeImage src={img.src} alt={img.alt} className={`w-full transition duration-700 group-hover:scale-110 ${i % 3 === 0 ? 'h-56 md:h-full' : 'h-56'}`} />
              <div className="absolute inset-0 bg-linear-to-t from-ink-950/80 via-transparent to-transparent opacity-80" aria-hidden="true" />
              <p className="absolute bottom-3 left-3 text-sm font-semibold text-white">{img.alt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-page py-8">
        <h2 className="section-title text-center">Как работи?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className="card relative overflow-hidden p-6">
              <span className={`font-display text-6xl font-bold ${i === 1 ? 'text-accent-500/30' : 'text-brand-500/30'}`}>{s.n}</span>
              <h3 className="mt-2 font-display text-xl font-semibold uppercase tracking-wide text-white">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page mt-16">
        <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 px-6 py-14 text-center sm:px-12">
          <SafeImage src={BARBER_IMAGES.interior} alt="" className="absolute inset-0 -z-20 h-full w-full" />
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-brand-900/95 via-ink-950/90 to-accent-800/90" aria-hidden="true" />
          <div className="barber-stripes absolute inset-x-0 top-0 h-1.5" aria-hidden="true" />
          <h2 className="font-display text-4xl font-bold uppercase tracking-wide text-white">Време е за свежа визия</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Регистрацията отнема под минута. Резервацията – още по-малко.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/booking" className="btn-accent px-7 py-3.5 text-base uppercase tracking-wider">
              Резервирай час
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn-secondary px-7 py-3.5 text-base uppercase tracking-wider">
                Създай профил
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
