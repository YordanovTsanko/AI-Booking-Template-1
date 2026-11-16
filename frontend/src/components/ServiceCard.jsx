import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatPrice } from '../utils/format.js';

const GRADIENTS = [
  'from-brand-500 to-purple-500',
  'from-sky-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-orange-400',
  'from-amber-500 to-pink-500',
];

export function ServiceImage({ service, className = 'h-44', compact = false }) {
  const [failed, setFailed] = useState(false);
  const gradient = GRADIENTS[(service.title || '').length % GRADIENTS.length];

  if (!service.image || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}>
        {compact ? (
          <span className="text-xl font-extrabold text-white/95">{(service.title || '?').charAt(0)}</span>
        ) : (
          <span className="px-4 text-center text-lg font-bold text-white/95 drop-shadow">{service.title}</span>
        )}
      </div>
    );
  }
  return <img src={service.image} alt={service.title} loading="lazy" onError={() => setFailed(true)} className={`w-full object-cover ${className}`} />;
}

export default function ServiceCard({ service, onSelect, selected = false, actionLabel = 'Резервирай' }) {
  return (
    <article
      className={`card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl ${selected ? 'ring-2 ring-brand-500' : ''}`}
    >
      <div className="relative overflow-hidden">
        <ServiceImage service={service} />
        <span className="badge absolute left-3 top-3 bg-white/90 text-slate-700 backdrop-blur">{service.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-slate-900">{service.title}</h3>
        <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-500">{service.description || 'Описанието скоро ще бъде добавено.'}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-extrabold text-slate-900">{formatPrice(service.price)}</p>
            <p className="text-xs text-slate-500">⏱ {formatDuration(service.duration)}</p>
          </div>
          {onSelect ? (
            <button type="button" onClick={() => onSelect(service)} className={selected ? 'btn-success' : 'btn-primary'}>
              {selected ? '✓ Избрана' : 'Избери'}
            </button>
          ) : (
            <Link to={`/booking?service=${service._id}`} className="btn-primary">
              {actionLabel}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
