"use client";

import { useState } from "react";
import Link from "next/link";
import { IconSearch, IconPlus } from "@/lib/icons";
import { type Project } from "@/lib/mock-data";
import ProjectCard from "@/components/projects/project-card";
import EmptyState from "@/components/shared/empty-state";

export default function ProjectSearch({ projects }: { projects: Project[] }) {
  const [search, setSearch] = useState("");

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.dbName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Search */}
      <div className="relative mb-6">
        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full max-w-sm pl-10 pr-4 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-150"
        />
      </div>

      {/* Project Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project, index) => (
            <div key={project.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
              <ProjectCard project={project} />
            </div>
          ))}
          <Link
            href="/projects/new"
            className="group flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-border hover:border-accent/50 bg-transparent hover:bg-accent-muted/30 transition-all duration-200 min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-xl bg-bg-tertiary group-hover:bg-accent-muted flex items-center justify-center mb-3 transition-colors">
              <IconPlus size={24} className="text-text-muted group-hover:text-accent transition-colors" />
            </div>
            <p className="text-sm font-medium text-text-muted group-hover:text-accent transition-colors">New Project</p>
          </Link>
        </div>
      ) : (
        <EmptyState
          icon="🔍"
          title="No projects found"
          description={`No projects match "${search}". Try a different search term.`}
        />
      )}
    </>
  );
}
