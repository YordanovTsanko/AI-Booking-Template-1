import { Link } from 'react-router-dom';
import type { Service } from '../types';
import { formatDuration, formatPrice } from '../utils/format';
import SafeImage from './SafeImage';

interface ServiceImageProps {
  service: Pick<Service, 'title' | 'image'>;
  className?: string;
  compact?: boolean;
}

export function ServiceImage({ service, className = 'h-48 w-full', compact = false }: ServiceImageProps) {
  return (
    <SafeImage
      src={service.image}
      alt={service.title}
      className={className}
      fallback={
        compact ? (
          <span className="font-display text-xl font-bold text-white">{(service.title || '?').charAt(0)}</span>
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-900/80 text-3xl ring-2 ring-white/20" aria-hidden="true">
            ✂️
          </span>
        )
      }
    />
  );
}

interface ServiceCardProps {
  service: Service;
  onSelect?: (service: Service) => void;
  selected?: boolean;
  actionLabel?: string;
}

export default function ServiceCard({ service, onSelect, selected = false, actionLabel = 'Резервирай' }: ServiceCardProps) {
  return (
    <article
      className={`card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-glow ${
        selected ? 'border-brand-500 ring-2 ring-brand-500/60' : ''
      }`}
    >
      <div className="relative overflow-hidden">
        <ServiceImage service={service} className="h-48 w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-800 via-ink-800/10 to-transparent" aria-hidden="true" />
        <span className="badge absolute left-3 top-3 bg-ink-900/80 text-slate-200 ring-1 ring-white/15 backdrop-blur">{service.category}</span>
        <span className="absolute right-3 top-3 rounded-lg bg-accent-600 px-2.5 py-1 text-sm font-bold text-white shadow-glow-red">{formatPrice(service.price)}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-semibold uppercase tracking-wide text-white">{service.title}</h3>
        <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-400">{service.description || 'Описанието скоро ще бъде добавено.'}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-sm text-slate-400">
            <svg className="h-4 w-4 text-brand-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .2.08.39.22.53l3 3a.75.75 0 101.06-1.06l-2.78-2.78V5z" clipRule="evenodd" />
            </svg>
            {formatDuration(service.duration)}
          </p>
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
