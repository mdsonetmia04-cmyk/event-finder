"use client";

/** Shimmering placeholder blocks shown while content loads. */
export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

/** Card-shaped placeholder. */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-5" aria-hidden="true">
      <Skeleton className="h-5 w-2/5 rounded-md" />
      <div className="mt-3 grid gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 rounded-md" style={{ width: `${92 - i * 14}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Chart-shaped placeholder. */
export function ChartSkeleton() {
  return (
    <div className="card p-5" aria-hidden="true">
      <Skeleton className="h-5 w-1/3 rounded-md" />
      <div className="mt-4 flex h-44 items-end gap-2">
        {[70, 45, 85, 55, 95, 38, 66, 78, 52, 88, 60, 72].map((h, i) => (
          <Skeleton key={i} className="w-full rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Dashboard-shaped placeholder used while auth/data is loading. */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-16 md:gap-24" aria-hidden="true">
      <section>
        <Skeleton className="h-10 w-2/3 rounded-xl" />
        <Skeleton className="mt-4 h-4 w-1/2 rounded-md" />
        <div className="mt-6 flex gap-3">
          <Skeleton className="h-11 w-40 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
      </section>
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="mt-3 h-8 w-1/3 rounded-md" />
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton lines={2} />
          <CardSkeleton />
        </div>
      </section>
    </div>
  );
}
