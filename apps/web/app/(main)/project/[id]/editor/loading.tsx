import { SkeletonTable, Skeleton } from "@/components/shared/skeleton";

export default function TableEditorLoading() {
  return (
    <div className="flex h-full">
      {/* Table List */}
      <div className="w-56 border-r border-border bg-bg-secondary p-3 space-y-1">
        <Skeleton className="h-8 w-full rounded-lg mb-3" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>

      {/* Table Content */}
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
        <SkeletonTable rows={8} cols={5} />
      </div>
    </div>
  );
}
