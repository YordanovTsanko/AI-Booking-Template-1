/** Skeleton loaders shown while lists are loading. */

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="skeleton h-48 rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-4 w-1/3" />
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-5/6" />
        <div className="flex justify-between pt-2">
          <div className="skeleton h-6 w-20" />
          <div className="skeleton h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Зарежда...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="card flex flex-wrap items-center gap-4 p-4" aria-hidden="true">
      <div className="skeleton h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-3 w-1/3" />
      </div>
      <div className="skeleton h-8 w-24 rounded-lg" />
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Зарежда...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Зарежда...">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-3 p-5" aria-hidden="true">
          <div className="skeleton h-3 w-1/2" />
          <div className="skeleton h-7 w-2/3" />
        </div>
      ))}
    </div>
  );
}
