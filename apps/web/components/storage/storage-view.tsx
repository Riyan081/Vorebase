"use client";

import { useState } from "react";
import { mockBuckets, mockFiles, type StorageFile } from "@/lib/mock-data";
import BucketSidebar from "@/components/storage/bucket-sidebar";
import FileBrowser from "@/components/storage/file-browser";
import UploadZone from "@/components/storage/upload-zone";
import CreateBucketModal from "@/components/storage/create-bucket-modal";
import FilePreview from "@/components/storage/file-preview";
import { IconFolder, IconUpload } from "@/lib/icons";

export default function StorageView() {
  const [selectedBucket, setSelectedBucket] = useState<string>(mockBuckets[0]?.id || "");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);

  const currentBucket = mockBuckets.find((b) => b.id === selectedBucket);
  const files = mockFiles[selectedBucket] || [];

  return (
    <div className="flex h-full">
      <BucketSidebar
        buckets={mockBuckets}
        selectedBucket={selectedBucket}
        onSelectBucket={setSelectedBucket}
        onCreateBucket={() => setShowCreateModal(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentBucket ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-primary">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <IconFolder size={14} className="text-accent" />
                  <span className="font-mono">{currentBucket.name}</span>
                </h2>
                <span className="text-xs text-text-muted px-2 py-0.5 rounded-full bg-bg-secondary border border-border">
                  {currentBucket.totalSize}
                </span>
                {currentBucket.isPublic && (
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

      <CreateBucketModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <FilePreview file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
