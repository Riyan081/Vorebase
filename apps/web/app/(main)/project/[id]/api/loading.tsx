import { SkeletonTable, Skeleton } from "@/components/shared/skeleton";

export default function ApiDocsLoading() {
  return (
    <div className="p-6 space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border pb-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-t-lg" />
        ))}
      </div>

      {/* Endpoint list */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-bg-secondary">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 flex-1 max-w-xs" />
            <Skeleton className="h-3 w-40 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
