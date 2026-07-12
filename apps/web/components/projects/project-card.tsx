import Link from "next/link";
import { IconChevronRight, IconDatabase, IconClock } from "@/lib/icons";
import { type Project } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ProjectCard({ project }: { project: Project }) {
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
            <p className="text-xs text-text-muted font-mono">{project.db_name}</p>
          </div>
        </div>
        <IconChevronRight size={16} className="text-text-muted group-hover:text-text-secondary transition-colors mt-1" />
      </div>

      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
        <div>
          <p className="text-lg font-semibold text-text-primary">{project.counts?.users ?? 0}</p>
          <p className="text-xs text-text-muted">Users</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-text-primary">{project.counts?.buckets ?? 0}</p>
          <p className="text-xs text-text-muted">Buckets</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-text-primary">{project.counts?.rls_policies ?? 0}</p>
          <p className="text-xs text-text-muted">Policies</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-text-muted">
        <IconClock size={12} />
        Created {formatDate(project.created_at)}
      </div>
    </Link>
  );
}
