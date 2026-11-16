import type { ReactNode } from 'react';
import type { FeedbackType, FieldError } from '../types';

const STYLES: Record<FeedbackType, { box: string; icon: string; path: string }> = {
  success: {
    box: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    icon: 'text-emerald-400',
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z',
  },
  error: {
    box: 'border-accent-500/40 bg-accent-500/10 text-accent-300',
    icon: 'text-accent-400',
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 7.3a1 1 0 00-1.4 1.4L8.6 10l-1.3 1.3a1 1 0 101.4 1.4l1.3-1.3 1.3 1.3a1 1 0 001.4-1.4L11.4 10l1.3-1.3a1 1 0 00-1.4-1.4L10 8.6 8.7 7.3z',
  },
  warning: {
    box: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    icon: 'text-amber-400',
    path: 'M8.3 2.9a2 2 0 013.4 0l6.1 10.6A2 2 0 0116.1 16.5H3.9a2 2 0 01-1.7-3l6.1-10.6zM10 6a1 1 0 00-1 1v3a1 1 0 102 0V7a1 1 0 00-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z',
  },
  info: {
    box: 'border-brand-500/30 bg-brand-500/10 text-brand-200',
    icon: 'text-brand-400',
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 11-2 0 1 1 0 012 0zm-2 3a1 1 0 112 0v4a1 1 0 11-2 0v-4z',
  },
};

interface InlineFeedbackProps {
  type?: FeedbackType;
  message?: string;
  errors?: FieldError[];
  onClose?: () => void;
  className?: string;
  children?: ReactNode;
}

/**
 * Inline, server-driven feedback box (no toasts).
 */
export default function InlineFeedback({ type = 'info', message, errors = [], onClose, className = '', children }: InlineFeedbackProps) {
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
        <button type="button" onClick={onClose} className="-m-1 rounded-lg p-1 opacity-60 transition hover:bg-white/10 hover:opacity-100" aria-label="Затвори съобщението">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}
