"use client";

import { IconX } from "@/lib/icons";
import type { TableInfo } from "@/lib/mock-data";

interface InsertRowPanelProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableInfo | null;
}

export default function InsertRowPanel({ isOpen, onClose, table }: InsertRowPanelProps) {
  if (!isOpen || !table) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg bg-bg-secondary border border-border rounded-xl shadow-xl animate-scale-in max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">Insert Row into <code className="text-accent">{table.name}</code></h2>
          <button onClick={onClose} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all">
            <IconX size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {table.columns.filter(c => !c.isPrimaryKey && c.defaultValue !== 'now()' && c.defaultValue !== 'auto_increment').map((col) => (
            <div key={col.name}>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1.5">
                <span className="font-mono">{col.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted">{col.type}</span>
                {col.nullable && <span className="text-[10px] text-text-muted">nullable</span>}
              </label>
              <input
                type="text"
                placeholder={col.nullable ? "NULL" : `Enter ${col.type}...`}
                className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-tertiary transition-all">
            Cancel
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-sm font-semibold transition-all">
            Insert Row
          </button>
        </div>
      </div>
    </div>
  );
}
