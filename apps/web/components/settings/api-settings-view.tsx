"use client";

import { mockApiKeys } from "@/lib/mock-data";
import { SettingsNav } from "@/components/layouts/settings-nav";
import ApiKeyRow from "@/components/settings/api-key-row";
import CopyButton from "@/components/shared/copy-button";
import { IconRefresh } from "@/lib/icons";

export default function ApiSettingsView({ projectId }: { projectId: string }) {
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
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary text-xs font-medium transition-all">
            <IconRefresh size={12} />
            Regenerate
          </button>
        </div>
        <div className="space-y-3">
          {mockApiKeys.map((key) => (
            <ApiKeyRow
              key={key.id}
              label={key.name}
              keyValue={key.key}
              role={key.role}
              createdAt={key.createdAt}
            />
          ))}
        </div>
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
