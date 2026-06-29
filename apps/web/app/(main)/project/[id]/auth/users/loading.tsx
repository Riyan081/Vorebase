import { SkeletonTable, Skeleton } from "@/components/shared/skeleton";

export default function UsersLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Search + button */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <SkeletonTable rows={10} cols={5} />
    </div>
  );
}
