"use client";

import { useState } from "react";
import { IconX } from "@/lib/icons";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description: string;
  confirmText: string;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  isDanger = true,
}: ConfirmModalProps) {
  const [confirmInput, setConfirmInput] = useState("");

  if (!isOpen) return null;

  const isConfirmDisabled = isDanger && confirmInput !== "DELETE";

  const handleConfirm = () => {
    if (isConfirmDisabled) return;
    onConfirm?.();
    setConfirmInput("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-bg-secondary border border-border rounded-xl shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className={`text-base font-semibold ${isDanger ? "text-danger" : "text-warning"}`}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-text-secondary">{description}</p>
          {isDanger && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Type <code className="text-danger font-mono">DELETE</code> to confirm
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-danger/30 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-danger/50 focus:border-danger transition-all"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-tertiary transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              isDanger
                ? "bg-danger hover:bg-danger-hover text-white"
                : "bg-warning/90 hover:bg-warning text-bg-primary"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
