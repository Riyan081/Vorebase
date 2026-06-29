"use client";

import { useState } from "react";
import Link from "next/link";
import { IconDatabase, IconChevronDown } from "@/lib/icons";
import { mockProjects, getProjectById } from "@/lib/mock-data";

interface ProjectSelectorProps {
  projectId: string;
  collapsed: boolean;
}

export default function ProjectSelector({ projectId, collapsed }: ProjectSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const project = getProjectById(projectId);

  if (collapsed) {
    return (
      <div className="flex justify-center">
        <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
          <IconDatabase size={14} className="text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-bg-tertiary hover:bg-bg-hover border border-border text-left transition-all duration-150"
      >
        <div className="w-6 h-6 rounded bg-accent-muted flex items-center justify-center flex-shrink-0">
          <IconDatabase size={12} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-primary truncate">
            {project?.name || "Select Project"}
          </p>
          <p className="text-[10px] text-text-muted font-mono truncate">
            {project?.dbName || "—"}
          </p>
        </div>
        <IconChevronDown size={12} className="text-text-muted flex-shrink-0" />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-tertiary border border-border rounded-lg shadow-lg z-50 animate-scale-in overflow-hidden">
          {mockProjects.map((p) => (
            <Link
              key={p.id}
              href={`/project/${p.id}`}
              onClick={() => setShowDropdown(false)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-bg-hover transition-colors ${
                p.id === projectId ? "text-accent bg-accent-muted/20" : "text-text-secondary"
              }`}
            >
              <IconDatabase size={14} />
              <span className="truncate">{p.name}</span>
            </Link>
          ))}
          <div className="border-t border-border">
            <Link
              href="/projects"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-xs text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors"
            >
              All projects →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
