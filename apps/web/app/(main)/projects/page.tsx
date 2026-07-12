"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VorebaseLogo, IconPlus, IconLogOut } from "@/lib/icons";
import { listProjects, type Project } from "@/lib/api";
import { isAuthenticated, getAdminUser, clearToken } from "@/lib/auth";
import ProjectSearch from "@/components/projects/project-search";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const admin = getAdminUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    listProjects()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  return (
    <div className="min-h-full bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="w-full max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/projects" className="flex items-center gap-3">
            <VorebaseLogo size={28} />
            <span className="text-lg font-semibold text-text-primary tracking-tight">Vorebase</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-secondary border border-border">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent">
                {admin?.email?.[0]?.toUpperCase() || "A"}
              </div>
              <span className="text-sm text-text-secondary">{admin?.email || "admin"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-secondary transition-all duration-150"
              title="Sign out"
            >
              <IconLogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-sm text-danger">{error}</p>
          </div>
        ) : (
          <ProjectSearch projects={projects} />
        )}
      </main>
    </div>
  );
}
