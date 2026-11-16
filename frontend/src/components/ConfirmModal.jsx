import { useEffect, useRef } from 'react';
import InlineFeedback from './InlineFeedback.jsx';

/**
 * Confirmation dialog for destructive actions.
 */
export default function ConfirmModal({
  open,
  title = 'Сигурен ли си?',
  message = 'Това действие не може да бъде отменено.',
  confirmText = 'Изтрий',
  cancelText = 'Отказ',
  variant = 'danger',
  loading = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => cancelRef.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !loading && onCancel?.()} aria-hidden="true" />
      <div className="card relative w-full max-w-md animate-fade-in p-6">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-rose-100' : 'bg-brand-100'}`}>
            <svg className={`h-6 w-6 ${variant === 'danger' ? 'text-rose-600' : 'text-brand-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{message}</p>
          </div>
        </div>

        {error && <InlineFeedback type="error" message={error} className="mt-4" />}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button type="button" className={variant === 'danger' ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={loading}>
            {loading ? 'Зарежда...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
