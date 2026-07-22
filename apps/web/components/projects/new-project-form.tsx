"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconDatabase } from "@/lib/icons";
import { useToast } from "@/components/shared/toast";
import { createProject } from "@/lib/api";

export default function NewProjectForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError("");
    setIsLoading(true);
    try {
      const project = await createProject(name.trim(), description.trim() || undefined);
      showToast(`Project "${project.name}" created successfully!`, "success");
      router.push(`/project/${project.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      setError(message);
      showToast(message, "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Create a new project</h1>
      <p className="text-sm text-text-secondary mb-8">
        Your project will have its own database, API keys, and authentication.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-xl border border-border bg-bg-secondary">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
              <IconDatabase size={16} className="text-accent" />
            </div>
            <h2 className="text-base font-semibold text-text-primary">Project Details</h2>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-danger-muted/20 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-text-secondary mb-1.5">
                Project Name
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome App"
                required
                maxLength={100}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-150"
              />
            </div>
            <div>
              <label htmlFor="project-description" className="block text-sm font-medium text-text-secondary mb-1.5">
                Description <span className="text-text-muted">(optional)</span>
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of what this project is for..."
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-150 resize-none"
              />
              <p className="mt-1.5 text-xs text-text-muted">
                A dedicated MySQL database will be created automatically for this project.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/projects"
            className="px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary text-sm font-medium transition-all duration-150"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-bg-primary text-sm font-semibold transition-all duration-150 hover:shadow-glow"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Project"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
