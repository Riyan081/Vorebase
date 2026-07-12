"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { listBuckets, listObjects, type StorageBucket, type StorageFile } from "@/lib/api";
import BucketSidebar from "@/components/storage/bucket-sidebar";
import FileBrowser from "@/components/storage/file-browser";
import UploadZone from "@/components/storage/upload-zone";
import CreateBucketModal from "@/components/storage/create-bucket-modal";
import FilePreview from "@/components/storage/file-preview";
import { IconFolder, IconUpload } from "@/lib/icons";

export default function StorageView() {
  const params = useParams();
  const projectId = params.id as string;

  const [buckets, setBuckets] = useState<StorageBucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>("");
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch buckets
  useEffect(() => {
    if (!projectId) return;
    listBuckets(projectId)
      .then((data) => {
        setBuckets(data);
        if (data.length > 0 && !selectedBucket) {
          setSelectedBucket(data[0]!.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  // Fetch files when bucket changes
  useEffect(() => {
    if (!projectId || !selectedBucket) return;
    const bucket = buckets.find((b) => b.id === selectedBucket);
    if (!bucket) return;
    listObjects(projectId, bucket.name)
      .then((res) => setFiles(res.data))
      .catch(() => setFiles([]));
  }, [projectId, selectedBucket, buckets]);

  const currentBucket = buckets.find((b) => b.id === selectedBucket);

  return (
    <div className="flex h-full">
      <BucketSidebar
        buckets={buckets}
        selectedBucket={selectedBucket}
        onSelectBucket={setSelectedBucket}
        onCreateBucket={() => setShowCreateModal(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : currentBucket ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-primary">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <IconFolder size={14} className="text-accent" />
                  <span className="font-mono">{currentBucket.name}</span>
                </h2>
                <span className="text-xs text-text-muted px-2 py-0.5 rounded-full bg-bg-secondary border border-border">
                  {currentBucket.object_count ?? 0} files
                </span>
                {currentBucket.is_public && (
                  <span className="px-2 py-0.5 rounded-full bg-accent-muted text-accent text-xs font-medium">Public</span>
                )}
              </div>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-xs font-semibold transition-all">
                <IconUpload size={12} />
                Upload Files
              </button>
            </div>

            <UploadZone />

            <div className="flex-1 overflow-auto px-4 py-4">
              <FileBrowser
                files={files}
                onPreview={setPreviewFile}
                onDownload={() => {}}
                onDelete={() => {}}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <IconFolder size={40} className="text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-secondary">Select a bucket to browse files</p>
            </div>
          </div>
        )}
      </div>

      <CreateBucketModal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); listBuckets(projectId).then(setBuckets).catch(() => {}); }} />
      <FilePreview file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
