import { Skeleton } from "@/components/shared/skeleton";

export default function SqlEditorLoading() {
  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>

      {/* Editor pane */}
      <Skeleton className="flex-1 rounded-xl min-h-[200px]" />

      {/* Results pane */}
      <div className="h-48 rounded-xl border border-border bg-bg-secondary p-4 space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2 mt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
