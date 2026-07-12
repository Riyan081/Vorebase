"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { listApiKeys, type ApiKeyInfo } from "@/lib/api";
import { SettingsNav } from "@/components/layouts/settings-nav";
import ApiKeyRow from "@/components/settings/api-key-row";
import CopyButton from "@/components/shared/copy-button";
import { IconRefresh } from "@/lib/icons";

export default function ApiSettingsView({ projectId }: { projectId: string }) {
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listApiKeys(projectId)
      .then(setApiKeys)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

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

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary">API Keys</h2>
          <button
            onClick={() => { setLoading(true); listApiKeys(projectId).then(setApiKeys).catch(() => {}).finally(() => setLoading(false)); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary text-xs font-medium transition-all"
          >
            <IconRefresh size={12} />
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-border bg-bg-secondary">
            <p className="text-sm text-text-secondary">No API keys created yet</p>
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
