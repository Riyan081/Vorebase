import { Skeleton } from "@/components/shared/skeleton";

export default function LogsLoading() {
  return (
    <div className="p-6 space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Log entries */}
      <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-bg-tertiary flex gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 flex-1" />
        </div>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-border last:border-0">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
