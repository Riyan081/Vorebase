import { IconTable, IconUsers, IconFolder, IconCode, IconZap, IconGlobe } from "@/lib/icons";
import { getProjectById, mockApiKeys } from "@/lib/mock-data";
import StatCard from "@/components/shared/stat-card";
import ConnectInfo from "@/components/shared/connect-info";
import GettingStarted from "@/components/shared/getting-started";

export default async function ProjectHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProjectById(id);

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
          {project.region}
          <span className="text-text-muted">•</span>
          <span className="font-mono">{project.dbName}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<IconTable size={18} className="text-accent" />} label="Tables" value={String(project.tablesCount)} href={`/project/${id}/editor`} />
        <StatCard icon={<IconUsers size={18} className="text-accent" />} label="Auth Users" value={project.usersCount.toLocaleString()} href={`/project/${id}/auth/users`} />
        <StatCard icon={<IconFolder size={18} className="text-accent" />} label="Storage Used" value={project.storageUsed} href={`/project/${id}/storage`} />
        <StatCard icon={<IconZap size={18} className="text-accent" />} label="API Requests (24h)" value="12.4K" href={`/project/${id}/api`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Connection Details */}
        <ConnectInfo
          projectId={id}
          anonKey={mockApiKeys[0]?.key || "—"}
          serviceRoleKey={mockApiKeys[1]?.key || "—"}
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
