import { Link } from 'react-router-dom';

/**
 * Friendly placeholder for empty lists with a call-to-action.
 */
export default function EmptyState({
  title = 'Все още няма нищо тук',
  description = 'Когато се появят данни, ще ги видиш тук.',
  actionLabel,
  actionTo,
  onAction,
  icon,
  className = '',
}) {
  return (
    <div className={`card flex flex-col items-center px-6 py-14 text-center ${className}`}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-purple-100 text-brand-600">
        {icon || (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0h-4.5l-1.5 2h-4l-1.5-2H4" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
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
