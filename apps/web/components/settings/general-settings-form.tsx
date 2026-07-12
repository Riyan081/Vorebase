"use client";

import { useState, useEffect } from "react";
import { getProject, updateProject, type Project } from "@/lib/api";
import { SettingsNav } from "@/components/layouts/settings-nav";
import { useToast } from "@/components/shared/toast";

export default function GeneralSettingsForm({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    getProject(projectId)
      .then((proj) => {
        setProject(proj);
        setProjectName(proj.name);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProject(projectId, { name: projectName });
      showToast("Project settings saved successfully.", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <SettingsNav projectId={projectId} />
        <div className="flex items-center justify-center py-12">
          <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <SettingsNav projectId={projectId} />

      <div className="p-6 rounded-xl border border-border bg-bg-secondary">
        <h2 className="text-base font-semibold text-text-primary mb-4">General</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full max-w-md px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Database Name</label>
            <input
              type="text"
              value={project?.db_name || ""}
              disabled
              className="w-full max-w-md px-3 py-2.5 rounded-lg bg-bg-tertiary border border-border text-text-muted text-sm font-mono cursor-not-allowed"
            />
            <p className="text-xs text-text-muted mt-1">Database name cannot be changed after creation.</p>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-bg-primary text-sm font-semibold transition-all hover:shadow-glow"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
