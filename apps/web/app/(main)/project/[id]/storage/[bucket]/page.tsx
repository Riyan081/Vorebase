"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { listBuckets, listObjects, type StorageBucket, type StorageFile } from "@/lib/api";
import FileBrowser from "@/components/storage/file-browser";
import UploadZone from "@/components/storage/upload-zone";
import { IconFolder, IconUpload, IconChevronRight } from "@/lib/icons";

export default function StorageBucketPage() {
  const params = useParams();
  const id = params.id as string;
  const bucketSlug = params.bucket as string;

  const [currentBucket, setCurrentBucket] = useState<StorageBucket | null>(null);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listBuckets(id)
      .then((buckets) => {
        const found = buckets.find((b) => b.id === bucketSlug || b.name === bucketSlug);
        setCurrentBucket(found || null);
        if (found) {
          return listObjects(id, found.name).then((res) => setFiles(res.data));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, bucketSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentBucket) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <IconFolder size={48} className="text-text-muted" />
        <div className="text-center">
          <p className="text-lg font-medium text-text-primary mb-1">Bucket not found</p>
          <Link
            href={`/project/${id}/storage`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-sm font-semibold transition-all"
          >
            Back to Storage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link
            href={`/project/${id}/storage`}
            className="text-text-muted hover:text-accent transition-colors flex items-center gap-1"
          >
            <IconFolder size={14} />
            Storage
          </Link>
          <IconChevronRight size={14} className="text-text-muted" />
          <span className="text-text-primary font-mono font-medium">{currentBucket.name}</span>
          {currentBucket.is_public && (
            <span className="px-2 py-0.5 rounded-full bg-accent-muted text-accent text-xs font-medium ml-1">
              Public
            </span>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary font-mono">{currentBucket.name}</h1>
            <p className="text-sm text-text-secondary mt-1">
              {currentBucket.object_count ?? files.length} files
            </p>
          </div>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-sm font-semibold transition-all hover:shadow-glow">
            <IconUpload size={14} />
            Upload Files
          </button>
        </div>

        {/* Upload Zone */}
        <div className="mx-0 mb-4">
          <UploadZone />
        </div>

        {/* Files */}
        <FileBrowser files={files} onPreview={() => {}} onDownload={() => {}} onDelete={() => {}} />
      </div>
    </div>
  );
}
