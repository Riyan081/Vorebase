"use client";

import { useState } from "react";
import { createPolicy, deletePolicy, type RlsPolicy } from "@/lib/api";
import { IconX } from "@/lib/icons";

interface CreatePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onPolicyCreated: () => void;
}

const OPERATIONS = ["SELECT", "INSERT", "UPDATE", "DELETE", "ALL"];

export default function CreatePolicyModal({ isOpen, onClose, projectId, onPolicyCreated }: CreatePolicyModalProps) {
  const [name, setName] = useState("");
  const [tableName, setTableName] = useState("");
  const [operation, setOperation] = useState("SELECT");
  const [checkColumn, setCheckColumn] = useState("user_id");
  const [checkOp, setCheckOp] = useState("=");
  const [checkValue, setCheckValue] = useState("auth.uid()");
  const [roles, setRoles] = useState("authenticated");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setName(""); setTableName(""); setOperation("SELECT");
    setCheckColumn("user_id"); setCheckOp("="); setCheckValue("auth.uid()");
    setRoles("authenticated"); setError("");
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim() || !tableName.trim()) {
      setError("Policy name and table name are required.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await createPolicy({
        name: name.trim(),
        tableName: tableName.trim(),
        operation,
        check: { column: checkColumn, op: checkOp, value: checkValue },
        roles: roles.split(",").map((r) => r.trim()).filter(Boolean),
        projectId,
      });
      onPolicyCreated();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create policy");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
      <div className="w-full max-w-lg bg-bg-secondary border border-border rounded-xl shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">Create RLS Policy</h2>
          <button onClick={handleClose} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all">
            <IconX size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-danger-muted/20 border border-danger/20 text-danger text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Policy Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="own_posts"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Table Name</label>
            <input type="text" value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="posts"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Operation</label>
            <select value={operation} onChange={(e) => setOperation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all">
              {OPERATIONS.map((op) => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Check Rule</label>
            <div className="flex gap-2">
              <input type="text" value={checkColumn} onChange={(e) => setCheckColumn(e.target.value)} placeholder="column"
                className="flex-1 px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" />
              <select value={checkOp} onChange={(e) => setCheckOp(e.target.value)}
                className="w-16 px-2 py-2 rounded-lg bg-bg-input border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all">
                {["=", "!=", ">", "<", ">=", "<="].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <input type="text" value={checkValue} onChange={(e) => setCheckValue(e.target.value)} placeholder="auth.uid()"
                className="flex-1 px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" />
            </div>
            <p className="text-xs text-text-muted mt-1">e.g. column=<code className="font-mono">user_id</code>, op=<code className="font-mono">=</code>, value=<code className="font-mono">auth.uid()</code></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Roles (comma-separated)</label>
            <input type="text" value={roles} onChange={(e) => setRoles(e.target.value)} placeholder="authenticated"
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={handleClose} disabled={isLoading} className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-tertiary transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-bg-primary text-sm font-semibold transition-all">
            {isLoading ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />Creating...</span> : "Create Policy"}
          </button>
        </div>
      </div>
    </div>
  );
}
