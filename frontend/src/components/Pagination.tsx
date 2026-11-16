/** Builds a compact page list like: 1 … 4 5 6 … 12 */
export const getPageNumbers = (page: number, totalPages: number): (number | '…')[] => {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('…');
    result.push(p);
  });
  return result;
};

interface PaginationProps {
  page?: number;
  totalPages?: number;
  total?: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}

export default function Pagination({ page = 1, totalPages = 1, total, onChange, disabled = false }: PaginationProps) {
  if (totalPages <= 1) return null;
  const go = (p: number) => {
    if (p < 1 || p > totalPages || p === page || disabled) return;
    onChange(p);
  };

  return (
    <nav className="mt-8 flex flex-col items-center justify-between gap-3 sm:flex-row" aria-label="Страници">
      <p className="text-sm text-slate-400">
        Страница <span className="font-semibold text-white">{page}</span> от <span className="font-semibold text-white">{totalPages}</span>
        {typeof total === 'number' && <> · {total} резултата</>}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" className="btn-secondary btn-sm" onClick={() => go(page - 1)} disabled={page <= 1 || disabled} aria-label="Предишна страница">
          ← Назад
        </button>
        {getPageNumbers(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`dots-${i}`} className="px-2 text-slate-500">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              disabled={disabled}
              aria-current={p === page ? 'page' : undefined}
              className={`h-8 min-w-[2rem] rounded-lg px-2 text-xs font-semibold transition ${p === page ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className="btn-secondary btn-sm" onClick={() => go(page + 1)} disabled={page >= totalPages || disabled} aria-label="Следваща страница">
          Напред →
        </button>
      </div>
    </nav>
  );
}
