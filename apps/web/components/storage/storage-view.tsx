"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { listBuckets, listObjects, uploadFile, deleteFile, getSignedUrl, type StorageBucket, type StorageFile } from "@/lib/api";
import BucketSidebar from "@/components/storage/bucket-sidebar";
import FileBrowser from "@/components/storage/file-browser";
import UploadZone from "@/components/storage/upload-zone";
import CreateBucketModal from "@/components/storage/create-bucket-modal";
import FilePreview from "@/components/storage/file-preview";
import { useToast } from "@/components/shared/toast";
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const currentBucket = buckets.find((b) => b.id === selectedBucket);

  // Fetch buckets
  const fetchBuckets = () => {
    listBuckets(projectId)
      .then((data) => {
        setBuckets(data);
        if (data.length > 0 && !selectedBucket) {
          setSelectedBucket(data[0]!.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!projectId) return;
    fetchBuckets();
  }, [projectId]);

  // Fetch files when bucket changes
  const fetchFiles = () => {
    if (!projectId || !selectedBucket) return;
    const bucket = buckets.find((b) => b.id === selectedBucket);
    if (!bucket) return;
    listObjects(projectId, bucket.name)
      .then((res) => setFiles(res.data))
      .catch(() => setFiles([]));
  };

  useEffect(() => {
    fetchFiles();
  }, [projectId, selectedBucket, buckets]);

  // Handle file upload
  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !currentBucket) return;

    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        await uploadFile(projectId, currentBucket.name, file.name, file);
      }
      fetchFiles(); // Refresh file list
      showToast(`${fileList.length} file(s) uploaded successfully!`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload file";
      showToast(message, "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle file delete
  const handleDelete = async (file: StorageFile) => {
    if (!currentBucket) return;
    if (!confirm(`Are you sure you want to delete "${file.name}"? This action cannot be undone.`)) return;

    try {
      await deleteFile(projectId, currentBucket.name, file.name);
      fetchFiles(); // Refresh file list
      showToast(`"${file.name}" deleted successfully`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete file";
      showToast(message, "error");
    }
  };

  // Handle file download via signed URL
  const handleDownload = async (file: StorageFile) => {
    if (!currentBucket) return;

    try {
      const result = await getSignedUrl(projectId, currentBucket.name, file.name);
      window.open(result.signed_url, "_blank");
    } catch {
      // Fallback: try direct URL
      window.open(`/storage/v1/object/${encodeURIComponent(currentBucket.name)}/${file.name}`, "_blank");
    }
  };

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
                  {currentBucket.object_count ?? files.length} files
                </span>
                {currentBucket.is_public && (
                  <span className="px-2 py-0.5 rounded-full bg-accent-muted text-accent text-xs font-medium">Public</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {uploading && (
                  <span className="text-xs text-text-muted flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    Uploading...
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <IconUpload size={12} />
                  Upload Files
                </button>
              </div>
            </div>

            <UploadZone />

            <div className="flex-1 overflow-auto px-4 py-4">
              <FileBrowser
                files={files}
                onPreview={setPreviewFile}
                onDownload={handleDownload}
                onDelete={handleDelete}
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

      <CreateBucketModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchBuckets();
        }}
        projectId={projectId}
      />
      <FilePreview file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)} projectId={projectId} bucketName={currentBucket?.name ?? ""} />
    </div>
  );
}
