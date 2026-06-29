import { Skeleton, SkeletonText } from "@/components/shared/skeleton";

export default function SettingsLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Settings nav */}
      <div className="flex gap-1 border-b border-border pb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>

      {/* Settings card */}
      <div className="p-6 rounded-xl border border-border bg-bg-secondary space-y-5">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
          </div>
        ))}
        <div className="pt-4 border-t border-border">
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
