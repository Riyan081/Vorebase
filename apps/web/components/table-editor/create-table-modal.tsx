"use client";

import { useState } from "react";
import { IconX } from "@/lib/icons";
import { createTable } from "@/lib/api";

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onTableCreated?: () => void;
}

export default function CreateTableModal({ isOpen, onClose, projectId, onTableCreated }: CreateTableModalProps) {
  const [tableName, setTableName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setTableName("");
    setError("");
    onClose();
  };

  const handleCreate = async () => {
    if (!tableName.trim()) return;

    setError("");
    setIsLoading(true);
    try {
      await createTable(projectId, tableName.trim(), [
        {
          name: "id",
          type: "INT",
          primaryKey: true,
          autoIncrement: true,
          nullable: false,
        },
        {
          name: "created_at",
          type: "TIMESTAMP",
          nullable: false,
          defaultValue: "CURRENT_TIMESTAMP",
        },
      ]);
      setTableName("");
      onTableCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create table");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
      <div className="w-full max-w-md bg-bg-secondary border border-border rounded-xl shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">Create New Table</h2>
          <button onClick={handleClose} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all">
            <IconX size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-danger-muted/20 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Table Name</label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !isLoading) handleCreate(); }}
              placeholder="e.g. products"
              disabled={isLoading}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all disabled:opacity-50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Schema</label>
            <select className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all">
              <option>public</option>
            </select>
          </div>
          <p className="text-xs text-text-muted">
            A default <code className="px-1 py-0.5 bg-bg-tertiary rounded text-accent">id</code> (auto-increment primary key) and <code className="px-1 py-0.5 bg-bg-tertiary rounded text-accent">created_at</code> column will be created automatically.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={handleClose} disabled={isLoading} className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-tertiary transition-all disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!tableName.trim() || isLoading}
            className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-sm font-semibold disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Table"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
