import BarberPole from './BarberPole';

interface LoadingScreenProps {
  timedOut?: boolean;
  onRetry?: () => void;
  retrying?: boolean;
}

/**
 * Full-screen blocking loader used by the health gate.
 * Covers everything and captures all pointer events.
 */
export default function LoadingScreen({ timedOut = false, onRetry, retrying = false }: LoadingScreenProps) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex select-none items-center justify-center bg-ink-950 px-6"
      role="alertdialog"
      aria-modal="true"
      aria-busy={!timedOut}
      aria-labelledby="loading-title"
      aria-describedby="loading-desc"
      style={{ pointerEvents: 'all', touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-accent-600/20 blur-3xl" aria-hidden="true" />

      <div className="relative flex max-w-md flex-col items-center text-center">
        <BarberPole height={140} width={40} animated={!timedOut} className="mb-8" />

        <h1 id="loading-title" className="font-display text-4xl font-semibold tracking-wide text-white sm:text-5xl">
          сървърът зарежда...
        </h1>
        <p id="loading-desc" className="mt-3 text-sm lowercase text-slate-400">
          това може да отнеме известно време, моля изчакай малко
        </p>

        {timedOut && (
          <div className="mt-8 w-full animate-fade-in">
            <p className="rounded-xl border border-accent-500/40 bg-accent-500/10 px-4 py-3 text-sm font-medium text-accent-300" role="alert">
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
