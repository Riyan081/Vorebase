"use client";

import { useState, useEffect } from "react";
import { IconX, IconDownload } from "@/lib/icons";
import type { StorageFile } from "@/lib/api";
import { getSignedUrl } from "@/lib/api";
import { formatBytes } from "@/lib/utils";

interface FilePreviewProps {
  file: StorageFile | null;
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  bucketName: string;
}

export default function FilePreview({ file, isOpen, onClose, projectId, bucketName }: FilePreviewProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  useEffect(() => {
    if (!isOpen || !file || !projectId || !bucketName) return;
    setLoadingUrl(true);
    getSignedUrl(projectId, bucketName, file.name)
      .then((res) => setSignedUrl(res.signed_url))
      .catch(() => setSignedUrl(null))
      .finally(() => setLoadingUrl(false));
  }, [isOpen, file?.name, projectId, bucketName]);

  const handleDownload = () => {
    if (!signedUrl || !file) return;
    const a = document.createElement("a");
    a.href = signedUrl;
    a.download = file.name; // forces browser to download, not open
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl bg-bg-secondary border border-border rounded-xl shadow-xl animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-text-primary font-mono">{file.name}</h2>
            <p className="text-xs text-text-muted mt-0.5">{file.mimeType} • {formatBytes(file.size)}</p>
          </div>
          <div className="flex items-center gap-2">
            {signedUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-xs font-semibold transition-all"
              >
                <IconDownload size={12} />
                Download
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all">
              <IconX size={16} />
            </button>
          </div>
        </div>
        <div className="p-6 flex items-center justify-center min-h-[300px] bg-bg-primary">
          {loadingUrl ? (
            <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          ) : file.mimeType.startsWith("image/") && signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signedUrl} alt={file.name} className="max-w-full max-h-[60vh] rounded-lg object-contain" />
          ) : file.mimeType.startsWith("video/") && signedUrl ? (
            <video src={signedUrl} controls className="max-w-full max-h-[60vh] rounded-lg" />
          ) : (
            <div className="text-center">
              <span className="text-6xl">📄</span>
              <p className="text-sm text-text-secondary mt-3">Preview not available for this file type</p>
              {signedUrl && (
                <button onClick={handleDownload} className="mt-3 text-xs text-accent hover:underline">
                  Download file instead
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
