"use client";

import { IconEdit, IconTrash } from "@/lib/icons";
import type { RlsPolicy } from "@/lib/api";

const operationColors: Record<string, string> = {
  SELECT: "bg-info-muted text-info",
  INSERT: "bg-accent-muted text-accent",
  UPDATE: "bg-warning-muted text-warning",
  DELETE: "bg-danger-muted text-danger",
  ALL: "bg-bg-tertiary text-text-primary",
};

interface PolicyCardProps {
  policy: RlsPolicy;
  onToggle: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function PolicyCard({ policy, onToggle, onEdit, onDelete }: PolicyCardProps) {
  return (
    <div className="group px-5 py-4 flex items-center gap-4 hover:bg-bg-tertiary/30 transition-colors">
      {/* Toggle */}
      <button
        onClick={() => onToggle(policy.id)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
          policy.isEnabled ? "bg-accent" : "bg-bg-tertiary border border-border"
        }`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          policy.isEnabled ? "left-[18px]" : "left-0.5"
        }`} />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className={`text-sm font-medium ${policy.isEnabled ? "text-text-primary" : "text-text-muted"}`}>
            {policy.name}
          </p>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${operationColors[policy.operation]}`}>
            {policy.operation}
          </span>
        </div>
        <code className="text-xs font-mono text-text-muted">{typeof policy.check === 'string' ? policy.check : JSON.stringify(policy.check)}</code>
        <div className="flex items-center gap-1 mt-1">
          {policy.roles.map((role) => (
            <span key={role} className="px-1.5 py-0.5 rounded bg-bg-tertiary text-[10px] text-text-muted">
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button onClick={() => onEdit(policy.id)} className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent-muted/30 transition-all" title="Edit">
            <IconEdit size={14} />
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(policy.id)} className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger-muted transition-all" title="Delete">
            <IconTrash size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
