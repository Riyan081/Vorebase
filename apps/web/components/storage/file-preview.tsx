"use client";

import { IconX } from "@/lib/icons";
import type { StorageFile } from "@/lib/mock-data";
import { formatBytes } from "@/lib/mock-data";

interface FilePreviewProps {
  file: StorageFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilePreview({ file, isOpen, onClose }: FilePreviewProps) {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl bg-bg-secondary border border-border rounded-xl shadow-xl animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-text-primary font-mono">{file.name}</h2>
            <p className="text-xs text-text-muted mt-0.5">{file.mimeType} • {formatBytes(file.size)}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all">
            <IconX size={16} />
          </button>
        </div>
        <div className="p-6 flex items-center justify-center min-h-[300px] bg-bg-primary">
          {file.mimeType.startsWith("image/") ? (
            <div className="text-center">
              <div className="w-64 h-48 bg-bg-secondary rounded-lg flex items-center justify-center border border-border">
                <span className="text-6xl">🖼️</span>
              </div>
              <p className="text-xs text-text-muted mt-3">Image preview</p>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-6xl">📄</span>
              <p className="text-sm text-text-secondary mt-3">Preview not available for this file type</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
