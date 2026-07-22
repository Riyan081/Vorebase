"use client";

import { useState } from "react";
import { IconX } from "@/lib/icons";
import type { TableInfo } from "@/lib/api";
import { insertRow } from "@/lib/api";

interface InsertRowPanelProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableInfo | null;
  projectId: string;
  onRowInserted?: () => void;
}

export default function InsertRowPanel({ isOpen, onClose, table, projectId, onRowInserted }: InsertRowPanelProps) {
  // SQL expression defaults are auto-handled by MySQL — no user input needed
  const SQL_EXPR_DEFAULTS = ["CURRENT_TIMESTAMP", "NOW()", "CURRENT_DATE", "CURRENT_TIME", "UUID()"];

  // Only hide columns that are truly auto-generated
  const editableColumns = table?.columns.filter((c) => {
    if (c.isPrimaryKey || c.autoIncrement) return false;
    // Hide only SQL expression defaults (e.g. CURRENT_TIMESTAMP) — MySQL fills these in
    if (c.defaultValue) {
      const upper = c.defaultValue.toUpperCase().trim();
      if (SQL_EXPR_DEFAULTS.includes(upper)) return false;
    }
    return true;
  }) ?? [];

  // Keep one state map for all field values
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !table) return null;

  const handleChange = (colName: string, val: string) => {
    setValues((prev) => ({ ...prev, [colName]: val }));
  };

  const handleSubmit = async () => {
    const newRow: Record<string, string | null> = {};
    for (const col of editableColumns) {
      const val = values[col.name];
      if (val === undefined || val === "") {
        // Has a DB default → omit entirely, MySQL uses it automatically
        if (col.defaultValue) continue;
        // Nullable with no default → send null
        if (col.nullable) newRow[col.name] = null;
        // NOT NULL with no default → omit, MySQL will return a clear error
      } else {
        newRow[col.name] = val;
      }
    }

    setError("");
    setIsLoading(true);
    try {
      await insertRow(projectId, table.name, newRow);
      setValues({});
      onRowInserted?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to insert row");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setValues({});
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
      <div className="w-full max-w-lg bg-bg-secondary border border-border rounded-xl shadow-xl animate-scale-in max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">Insert Row into <code className="text-accent">{table.name}</code></h2>
          <button onClick={handleClose} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all">
            <IconX size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-danger-muted/20 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}
          {editableColumns.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">No editable columns (all are auto-generated)</p>
          ) : (
            editableColumns.map((col) => (
              <div key={col.name}>
                <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1.5">
                  <span className="font-mono">{col.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted">{col.type}</span>
                  {col.nullable && <span className="text-[10px] text-text-muted">nullable</span>}
                </label>
                <input
                  type="text"
                  value={values[col.name] ?? ""}
                  onChange={(e) => handleChange(col.name, e.target.value)}
                  placeholder={col.nullable ? "NULL" : `Enter ${col.type}...`}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all disabled:opacity-50"
                />
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={handleClose} disabled={isLoading} className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-tertiary transition-all disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-bg-primary text-sm font-semibold transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                Inserting...
              </span>
            ) : (
              "Insert Row"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
