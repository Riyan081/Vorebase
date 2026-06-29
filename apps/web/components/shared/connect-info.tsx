"use client";

import { IconKey } from "@/lib/icons";
import CopyButton from "@/components/shared/copy-button";

interface ConnectInfoProps {
  projectId: string;
  anonKey: string;
  serviceRoleKey: string;
}

function CopyableField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-secondary mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 rounded-lg bg-bg-input border border-border text-xs font-mono text-text-primary truncate">
          {value}
        </code>
        <CopyButton text={value} size="sm" />
      </div>
    </div>
  );
}

export default function ConnectInfo({ projectId, anonKey, serviceRoleKey }: ConnectInfoProps) {
  return (
    <div className="p-6 rounded-xl border border-border bg-bg-secondary">
      <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
        <IconKey size={16} className="text-accent" />
        Connection Details
      </h2>
      <div className="space-y-4">
        <CopyableField label="Project URL" value={`https://${projectId}.vorebase.co`} />
        <CopyableField label="API Key (anon)" value={anonKey} />
        <CopyableField label="API Key (service_role)" value={serviceRoleKey} />
      </div>
    </div>
  );
}
