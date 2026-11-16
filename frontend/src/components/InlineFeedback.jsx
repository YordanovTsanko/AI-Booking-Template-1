const STYLES = {
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: 'text-emerald-500',
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z',
  },
  error: {
    box: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: 'text-rose-500',
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 7.3a1 1 0 00-1.4 1.4L8.6 10l-1.3 1.3a1 1 0 101.4 1.4l1.3-1.3 1.3 1.3a1 1 0 001.4-1.4L11.4 10l1.3-1.3a1 1 0 00-1.4-1.4L10 8.6 8.7 7.3z',
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: 'text-amber-500',
    path: 'M8.3 2.9a2 2 0 013.4 0l6.1 10.6A2 2 0 0116.1 16.5H3.9a2 2 0 01-1.7-3l6.1-10.6zM10 6a1 1 0 00-1 1v3a1 1 0 102 0V7a1 1 0 00-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z',
  },
  info: {
    box: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: 'text-sky-500',
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 11-2 0 1 1 0 012 0zm-2 3a1 1 0 112 0v4a1 1 0 11-2 0v-4z',
  },
};

/**
 * Inline, server-driven feedback box (no toasts).
 * Props: type ('success' | 'error' | 'warning' | 'info'), message, errors (server array), onClose, className, children
 */
export default function InlineFeedback({ type = 'info', message, errors = [], onClose, className = '', children }) {
  if (!message && !children) return null;
  const style = STYLES[type] || STYLES.info;
  const listErrors = (errors || []).filter((e) => e?.message && e.message !== message);

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`flex animate-fade-in items-start gap-3 rounded-xl border px-4 py-3 text-sm ${style.box} ${className}`}
    >
      <svg className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d={style.path} clipRule="evenodd" />
      </svg>
      <div className="min-w-0 flex-1">
        {message && <p className="font-medium leading-relaxed">{message}</p>}
        {listErrors.length > 1 && (
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs opacity-90">
            {listErrors.map((e, i) => (
              <li key={`${e.field}-${i}`}>{e.message}</li>
            ))}
          </ul>
        )}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="-m-1 rounded-lg p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
          aria-label="Затвори съобщението"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}
