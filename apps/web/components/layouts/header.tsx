"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMenu } from "@/lib/icons";
import { getProject, type Project } from "@/lib/api";

interface HeaderProps {
  projectId: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Header({ projectId, collapsed, onToggleCollapse }: HeaderProps) {
  const pathname = usePathname();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    getProject(projectId).then(setProject).catch(() => {});
  }, [projectId]);

  return (
    <header className="flex items-center justify-between px-6 border-b border-border min-h-[52px] bg-bg-primary/80 backdrop-blur-md">
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-secondary transition-all duration-150 lg:hidden"
        >
          <IconMenu size={16} />
        </button>
        <Link href="/projects" className="text-text-muted hover:text-text-secondary transition-colors">
          Projects
        </Link>
        <span className="text-text-muted">/</span>
        <span className="text-text-primary font-medium">
          {project?.name || "Loading..."}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-xs font-medium text-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          Healthy
        </span>
      </div>
    </header>
  );
}
