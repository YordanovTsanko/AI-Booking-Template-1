import { useEffect } from 'react';

/** Generic modal used for create/edit forms. */
export default function Modal({ open, title, onClose, children, footer, size = 'lg', busy = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy && !e.defaultPrevented) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, busy, onClose]);

  if (!open) return null;
  const width = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size] || 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !busy && onClose?.()} aria-hidden="true" />
      <div className={`relative flex max-h-[92vh] w-full ${width} animate-fade-in flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="modal-title" className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Затвори">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}
