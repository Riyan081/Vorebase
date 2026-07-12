"use client";

import { IconFolder, IconPlus } from "@/lib/icons";
import type { StorageBucket } from "@/lib/api";

interface BucketSidebarProps {
  buckets: StorageBucket[];
  selectedBucket: string;
  onSelectBucket: (id: string) => void;
  onCreateBucket: () => void;
}

export default function BucketSidebar({ buckets, selectedBucket, onSelectBucket, onCreateBucket }: BucketSidebarProps) {
  return (
    <div className="w-56 border-r border-border bg-bg-secondary flex flex-col flex-shrink-0">
      <div className="px-3 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Buckets</h3>
          <button
            onClick={onCreateBucket}
            className="p-1 rounded-md text-text-muted hover:text-accent hover:bg-accent-muted/30 transition-all"
            title="Create bucket"
          >
            <IconPlus size={14} />
          </button>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {buckets.map((bucket) => (
          <button
            key={bucket.id}
            onClick={() => onSelectBucket(bucket.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-150 ${
              selectedBucket === bucket.id
                ? "bg-accent-muted/30 text-accent"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            }`}
          >
            <IconFolder size={14} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm truncate">{bucket.name}</p>
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <span>{bucket.object_count ?? 0} files</span>
                {bucket.is_public && (
                  <span className="px-1 py-0 rounded bg-accent-muted/50 text-accent">public</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}
