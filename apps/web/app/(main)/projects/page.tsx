import Link from "next/link";
import { VorebaseLogo, IconPlus, IconLogOut } from "@/lib/icons";
import { mockProjects } from "@/lib/mock-data";
import ProjectSearch from "@/components/projects/project-search";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/projects" className="flex items-center gap-3">
            <VorebaseLogo size={28} />
            <span className="text-lg font-semibold text-text-primary tracking-tight">Vorebase</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-secondary border border-border">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent">
                A
              </div>
              <span className="text-sm text-text-secondary">admin@vorebase.io</span>
            </div>
            <Link
              href="/login"
              className="p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-secondary transition-all duration-150"
              title="Sign out"
            >
              <IconLogOut size={18} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
            <p className="text-sm text-text-secondary mt-1">Manage your Vorebase projects</p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-sm font-semibold transition-all duration-150 hover:shadow-glow"
          >
            <IconPlus size={16} />
            New Project
          </Link>
        </div>

        {/* ProjectSearch handles search state + renders cards */}
        <ProjectSearch projects={mockProjects} />
      </main>
    </div>
  );
}
