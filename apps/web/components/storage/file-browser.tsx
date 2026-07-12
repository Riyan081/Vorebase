"use client";

import { IconFolder, IconEye, IconDownload, IconTrash } from "@/lib/icons";
import type { StorageFile } from "@/lib/api";
import { formatBytes, formatDateTime } from "@/lib/utils";

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <span className="text-lg">🖼️</span>;
  if (mimeType.startsWith("video/")) return <span className="text-lg">🎬</span>;
  if (mimeType === "application/pdf") return <span className="text-lg">📄</span>;
  return <span className="text-lg">📁</span>;
}

interface FileBrowserProps {
  files: StorageFile[];
  onPreview?: (file: StorageFile) => void;
  onDownload?: (file: StorageFile) => void;
  onDelete?: (file: StorageFile) => void;
}

export default function FileBrowser({ files, onPreview, onDownload, onDelete }: FileBrowserProps) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <IconFolder size={40} className="text-text-muted mb-3" />
        <p className="text-sm font-medium text-text-primary mb-1">No files yet</p>
        <p className="text-xs text-text-secondary">Upload files to get started</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-bg-secondary">
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary">Name</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary">Type</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary">Size</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary">Created</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id} className="group border-t border-border hover:bg-bg-tertiary/30 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileIcon mimeType={file.mimeType} />
                  <span className="text-sm font-mono text-text-primary">{file.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-text-muted">{file.mimeType}</td>
              <td className="px-4 py-3 text-sm text-text-secondary">{formatBytes(file.size)}</td>
              <td className="px-4 py-3 text-sm text-text-secondary">{formatDateTime(file.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {file.mimeType.startsWith("image/") && onPreview && (
                    <button onClick={() => onPreview(file)} className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent-muted/30 transition-all" title="Preview">
                      <IconEye size={14} />
                    </button>
                  )}
                  <button onClick={() => onDownload?.(file)} className="p-1.5 rounded text-text-muted hover:text-info hover:bg-info-muted transition-all" title="Download">
                    <IconDownload size={14} />
                  </button>
                  <button onClick={() => onDelete?.(file)} className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger-muted transition-all" title="Delete">
                    <IconTrash size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
