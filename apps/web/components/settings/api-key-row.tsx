"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/mock-data";
import { IconCopy, IconCheck, IconEye, IconEyeOff } from "@/lib/icons";

interface ApiKeyRowProps {
  label: string;
  keyValue: string;
  role: string;
  createdAt: string;
}

export default function ApiKeyRow({ label, keyValue, role, createdAt }: ApiKeyRowProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(keyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayValue = visible ? keyValue : keyValue.slice(0, 20) + "•".repeat(20);

  return (
    <div className="p-4 rounded-xl border border-border bg-bg-secondary">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{label}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              role === "anon" ? "bg-accent-muted text-accent" : "bg-danger-muted text-danger"
            }`}
          >
            {role}
          </span>
        </div>
        <span className="text-xs text-text-muted">Created {formatDateTime(createdAt)}</span>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 rounded-lg bg-bg-input border border-border text-xs font-mono text-text-primary truncate">
          {displayValue}
        </code>
        <button
          onClick={() => setVisible(!visible)}
          className="p-2 rounded-lg border border-border text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-all"
        >
          {visible ? <IconEyeOff size={14} /> : <IconEye size={14} />}
        </button>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg border border-border text-text-muted hover:text-accent hover:bg-accent-muted/30 transition-all"
        >
          {copied ? <IconCheck size={14} className="text-accent" /> : <IconCopy size={14} />}
        </button>
      </div>
      {role === "service_role" && (
        <p className="mt-2 text-[11px] text-danger">
          ⚠️ This key bypasses Row Level Security. Never expose it in client-side code.
        </p>
      )}
    </div>
  );
}
