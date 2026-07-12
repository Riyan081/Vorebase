"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { listPolicies, togglePolicy as apiTogglePolicy, type RlsPolicy } from "@/lib/api";
import PolicyCard from "@/components/auth/policy-card";
import { IconPlus } from "@/lib/icons";

export default function PoliciesView() {
  const params = useParams();
  const projectId = params.id as string;

  const [policies, setPolicies] = useState<RlsPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    listPolicies(projectId)
      .then(setPolicies)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleToggle = async (policyId: string) => {
    try {
      const updated = await apiTogglePolicy(policyId);
      setPolicies((prev) =>
        prev.map((p) => (p.id === policyId ? updated : p))
      );
    } catch {
      // Optimistic toggle fallback
      setPolicies((prev) =>
        prev.map((p) => (p.id === policyId ? { ...p, isEnabled: !p.isEnabled } : p))
      );
    }
  };

  const grouped = policies.reduce((acc, policy) => {
    if (!acc[policy.tableName]) acc[policy.tableName] = [];
    acc[policy.tableName]!.push(policy);
    return acc;
  }, {} as Record<string, RlsPolicy[]>);

  return (
    <>
      <div className="flex items-center justify-end mb-6">
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-sm font-semibold transition-all hover:shadow-glow">
          <IconPlus size={14} />
          New Policy
        </button>
      </div>

      <div className="p-4 rounded-xl border border-accent/20 bg-accent-muted/10 mb-6">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-accent">Virtual RLS</span> — Vorebase enforces row-level security
          at the application layer. Policies defined here are evaluated on every request to filter data based on
          the authenticated user.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-text-secondary">No policies defined yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([tableName, tablePolicies]) => (
            <div key={tableName} className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-bg-tertiary flex items-center gap-2">
                <code className="text-sm font-mono font-semibold text-accent">{tableName}</code>
                <span className="text-xs text-text-muted">{tablePolicies.length} policies</span>
              </div>
              <div className="divide-y divide-border">
                {tablePolicies.map((policy) => (
                  <PolicyCard key={policy.id} policy={policy} onToggle={handleToggle} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
