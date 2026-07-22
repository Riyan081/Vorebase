"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { listApiKeys, createApiKey, deleteApiKey, type ApiKeyInfo, type ApiKeyCreateResult } from "@/lib/api";
import { SettingsNav } from "@/components/layouts/settings-nav";
import ApiKeyRow from "@/components/settings/api-key-row";
import CopyButton from "@/components/shared/copy-button";
import { IconRefresh, IconPlus, IconKey } from "@/lib/icons";

export default function ApiSettingsView({ projectId }: { projectId: string }) {
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKeyCreateResult | null>(null);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const fetchKeys = () => {
    setLoading(true);
    listApiKeys(projectId)
      .then(setApiKeys)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKeys();
  }, [projectId]);

  const handleCreateKey = async (keyName: "anon" | "service_role") => {
    setDropdownOpen(false);
    setCreating(true);
    setError("");
    try {
      const result = await createApiKey(keyName, projectId);
      setNewlyCreatedKey(result);
      fetchKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? Any applications using it will stop working.")) return;
    try {
      await deleteApiKey(id);
      fetchKeys();
    } catch {
      // Error handled silently
    }
  };

  return (
    <>
      <SettingsNav projectId={projectId} />

      <div className="p-4 rounded-xl border border-border bg-bg-secondary mb-6">
        <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Project URL</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 rounded-lg bg-bg-input border border-border text-sm font-mono text-accent">
            https://{projectId}.vorebase.co
          </code>
          <CopyButton text={`https://${projectId}.vorebase.co`} />
        </div>
      </div>

      {/* Newly Created Key Banner */}
      {newlyCreatedKey && (
        <div className="mb-6 p-4 rounded-xl border border-accent/30 bg-accent-muted/10">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <IconKey size={14} className="text-accent" />
              <p className="text-sm font-semibold text-text-primary">
                New {newlyCreatedKey.name} key created
              </p>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-warning mb-2">⚠️ {newlyCreatedKey.warning}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-bg-input border border-border text-xs font-mono text-text-primary break-all">
              {newlyCreatedKey.api_key}
            </code>
            <CopyButton text={newlyCreatedKey.api_key} />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-danger-muted/20 border border-danger/20 text-danger text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary">API Keys</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchKeys()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary text-xs font-medium transition-all"
            >
              <IconRefresh size={12} />
              Refresh
            </button>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                disabled={creating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-xs font-semibold transition-all disabled:opacity-50"
              >
                <IconPlus size={12} />
                {creating ? "Creating..." : "Generate Key"}
              </button>
              {/* JS-controlled dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-bg-secondary border border-border rounded-lg shadow-xl z-10">
                  <button
                    onClick={() => handleCreateKey("anon")}
                    className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-bg-tertiary transition-colors rounded-t-lg"
                  >
                    <span className="font-medium">anon</span>
                    <p className="text-[10px] text-text-muted mt-0.5">Public client key (limited access)</p>
                  </button>
                  <button
                    onClick={() => handleCreateKey("service_role")}
                    className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-bg-tertiary transition-colors rounded-b-lg border-t border-border"
                  >
                    <span className="font-medium">service_role</span>
                    <p className="text-[10px] text-text-muted mt-0.5">Server-side key (bypasses RLS)</p>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-border bg-bg-secondary">
            <p className="text-sm text-text-secondary">No API keys created yet</p>
            <p className="text-xs text-text-muted mt-1">Generate an anon key to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <ApiKeyRow
                key={key.id}
                label={key.name}
                keyValue={key.key_prefix + "..."}
                role={key.role}
                createdAt={key.created_at}
                onDelete={() => handleDeleteKey(key.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl border border-border bg-bg-secondary">
        <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">JWT Secret</p>
        <code className="block px-3 py-2 rounded-lg bg-bg-input border border-border text-xs font-mono text-text-primary">
          your-super-secret-jwt-key-change-in-production
        </code>
        <p className="mt-2 text-[11px] text-text-muted">
          Used to sign and verify JWTs. Keep this secret and rotate periodically.
        </p>
      </div>
    </>
  );
}
