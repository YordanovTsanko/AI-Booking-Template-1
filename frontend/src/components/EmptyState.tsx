import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}

/** Friendly placeholder for empty lists with a call-to-action. */
export default function EmptyState({
  title = 'Все още няма нищо тук',
  description = 'Когато се появят данни, ще ги видиш тук.',
  actionLabel,
  actionTo,
  onAction,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`card flex flex-col items-center px-6 py-14 text-center ${className}`}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600/30 to-accent-600/30 text-brand-300 ring-1 ring-white/10">
        {icon || (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path strokeLinecap="round" d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-6">
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionTo && onAction && (
        <button type="button" onClick={onAction} className="btn-primary mt-6">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
