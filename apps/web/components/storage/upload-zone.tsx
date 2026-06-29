"use client";

import { useState } from "react";
import { IconUpload } from "@/lib/icons";

interface UploadZoneProps {
  onFilesSelected?: (files: FileList) => void;
}

export default function UploadZone({ onFilesSelected }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`mx-4 mt-4 p-6 rounded-xl border-2 border-dashed transition-all duration-200 ${
        isDragOver
          ? "border-accent bg-accent-muted/20"
          : "border-border hover:border-border-light"
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files) onFilesSelected?.(e.dataTransfer.files);
      }}
    >
      <div className="text-center">
        <IconUpload size={24} className={`mx-auto mb-2 ${isDragOver ? "text-accent" : "text-text-muted"}`} />
        <p className="text-sm text-text-secondary">
          Drag &amp; drop files here, or{" "}
          <label className="text-accent hover:text-accent-hover font-medium cursor-pointer">
            browse
            <input
              type="file"
              className="hidden"
              multiple
              onChange={(e) => e.target.files && onFilesSelected?.(e.target.files)}
            />
          </label>
        </p>
        <p className="text-xs text-text-muted mt-1">Maximum file size: 50MB</p>
      </div>
    </div>
  );
}
