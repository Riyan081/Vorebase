"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { IconTable, IconUsers, IconFolder, IconCode, IconZap, IconGlobe } from "@/lib/icons";
import { getProject, listApiKeys, type Project, type ApiKeyInfo } from "@/lib/api";
import StatCard from "@/components/shared/stat-card";
import ConnectInfo from "@/components/shared/connect-info";
import GettingStarted from "@/components/shared/getting-started";

export default function ProjectHomePage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProject(id),
      listApiKeys(id).catch(() => []),
    ])
      .then(([proj, keys]) => {
        setProject(proj);
        setApiKeys(keys);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-secondary">Project not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">{project.name}</h1>
        <p className="text-sm text-text-secondary flex items-center gap-2">
          <IconGlobe size={14} />
          <span className="font-mono">{project.db_name}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<IconTable size={18} className="text-accent" />} label="API Keys" value={String(project.counts?.api_keys ?? apiKeys.length)} href={`/project/${id}/settings/api`} />
        <StatCard icon={<IconUsers size={18} className="text-accent" />} label="Auth Users" value={String(project.counts?.users ?? 0)} href={`/project/${id}/auth/users`} />
        <StatCard icon={<IconFolder size={18} className="text-accent" />} label="Buckets" value={String(project.counts?.buckets ?? 0)} href={`/project/${id}/storage`} />
        <StatCard icon={<IconZap size={18} className="text-accent" />} label="RLS Policies" value={String(project.counts?.rls_policies ?? 0)} href={`/project/${id}/auth/policies`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Connection Details */}
        <ConnectInfo
          projectId={id}
          anonKey={apiKeys.find((k) => k.role === "anon")?.key_prefix || "Generate an anon key →"}
          serviceRoleKey={apiKeys.find((k) => k.role === "service_role")?.key_prefix || "Generate a service key →"}
        />

        {/* Quick Start */}
        <div className="p-6 rounded-xl border border-border bg-bg-secondary">
          <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <IconCode size={16} className="text-accent" />
            Quick Start
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">Initialize your project:</p>
            <div className="p-4 rounded-lg bg-bg-primary border border-border">
              <pre className="text-xs font-mono text-text-primary overflow-x-auto">
{`import { createClient } from '@vorebase/js'

const vorebase = createClient(
  'https://${id}.vorebase.co',
  '<your-anon-key>'
)

// Query data
const { data } = await vorebase
  .from('posts')
  .select('*')
  .limit(10)`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Checklist */}
      <GettingStarted projectId={id} />
    </div>
  );
}
