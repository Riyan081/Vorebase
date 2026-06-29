"use client";

import { useState } from "react";
import { IconX } from "@/lib/icons";

interface CreateBucketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateBucketModal({ isOpen, onClose }: CreateBucketModalProps) {
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-bg-secondary border border-border rounded-xl shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">Create New Bucket</h2>
          <button onClick={onClose} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all">
            <IconX size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Bucket Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. avatars, uploads"
              className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded accent-accent"
            />
            <span className="text-sm text-text-secondary">Public bucket</span>
          </label>
          <p className="text-xs text-text-muted">Public buckets allow unauthenticated access to files. Use with caution.</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-tertiary transition-all">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-sm font-semibold transition-all">Create Bucket</button>
        </div>
      </div>
    </div>
  );
}
