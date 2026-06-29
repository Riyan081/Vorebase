import Link from "next/link";
import { IconChevronRight, IconDatabase, IconGlobe, IconClock } from "@/lib/icons";
import { formatDate, type Project } from "@/lib/mock-data";

export default function ProjectCard({ project }: { project: Project }) {
  const statusColors = {
    active: "bg-accent/15 text-accent",
    paused: "bg-warning-muted text-warning",
    inactive: "bg-bg-tertiary text-text-muted",
  };

  return (
    <Link
      href={`/project/${project.id}`}
      className="group block p-5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-tertiary hover:border-border-light transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center">
            <IconDatabase size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-text-muted font-mono">{project.dbName}</p>
          </div>
        </div>
        <IconChevronRight size={16} className="text-text-muted group-hover:text-text-secondary transition-colors mt-1" />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {project.status}
        </span>
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <IconGlobe size={12} />
          {project.region}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
        <div>
          <p className="text-lg font-semibold text-text-primary">{project.tablesCount}</p>
          <p className="text-xs text-text-muted">Tables</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-text-primary">{project.usersCount.toLocaleString()}</p>
          <p className="text-xs text-text-muted">Users</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-text-primary">{project.storageUsed}</p>
          <p className="text-xs text-text-muted">Storage</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-text-muted">
        <IconClock size={12} />
        Created {formatDate(project.createdAt)}
      </div>
    </Link>
  );
}
