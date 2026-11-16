/**
 * Full-screen blocking loader used by the health gate.
 * Covers everything, captures all pointer events.
 */
export default function LoadingScreen({ timedOut = false, onRetry, retrying = false }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex select-none items-center justify-center bg-gradient-to-br from-brand-50 via-white to-purple-50 px-6"
      role="alertdialog"
      aria-modal="true"
      aria-busy={!timedOut}
      aria-labelledby="loading-title"
      aria-describedby="loading-desc"
      style={{ pointerEvents: 'all', touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex max-w-md flex-col items-center text-center">
        {!timedOut ? (
          <div className="relative mb-8 h-20 w-20" aria-hidden="true">
            <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-600" />
            <div className="absolute inset-3 animate-pulse rounded-full bg-gradient-to-br from-brand-500 to-purple-500 opacity-80" />
          </div>
        ) : (
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100" aria-hidden="true">
            <svg className="h-10 w-10 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
          </div>
        )}

        <h1 id="loading-title" className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          сървърът зарежда...
        </h1>
        <p id="loading-desc" className="mt-3 text-sm lowercase text-slate-500">
          това може да отнеме известно време, моля изчакай малко
        </p>

        {timedOut && (
          <div className="mt-8 w-full animate-fade-in">
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="alert">
              Сървърът не отговаря. Провери връзката си и опитай отново.
            </p>
            <button type="button" onClick={onRetry} disabled={retrying} className="btn-primary mt-4 w-full sm:w-auto" autoFocus>
              {retrying ? 'Зарежда...' : 'Опитай отново'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
