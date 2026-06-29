"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconChevronLeft, IconDatabase, IconGlobe } from "@/lib/icons";
import { useToast } from "@/components/shared/toast";

const regions = [
  { id: "us-east-1", name: "US East (N. Virginia)", flag: "🇺🇸" },
  { id: "us-west-2", name: "US West (Oregon)", flag: "🇺🇸" },
  { id: "eu-west-1", name: "EU West (Ireland)", flag: "🇮🇪" },
  { id: "eu-central-1", name: "EU Central (Frankfurt)", flag: "🇩🇪" },
  { id: "ap-south-1", name: "Asia Pacific (Mumbai)", flag: "🇮🇳" },
  { id: "ap-southeast-1", name: "Asia Pacific (Singapore)", flag: "🇸🇬" },
];

export default function NewProjectForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [dbName, setDbName] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [isLoading, setIsLoading] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    setDbName(value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") + "_db");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast(`Project "${name}" created successfully!`, "success");
      router.push("/projects");
    } catch {
      showToast("Failed to create project. Please try again.", "error");
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
          <div className="space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-text-secondary mb-1.5">
                Project Name
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Awesome App"
                required
                className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-150"
              />
            </div>
            <div>
              <label htmlFor="db-name" className="block text-sm font-medium text-text-secondary mb-1.5">
                Database Name
              </label>
              <input
                id="db-name"
                type="text"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                placeholder="my_awesome_app_db"
                required
                className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-150"
              />
              <p className="mt-1.5 text-xs text-text-muted">Only lowercase letters, numbers, and underscores</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-bg-secondary">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-info-muted flex items-center justify-center">
              <IconGlobe size={16} className="text-info" />
            </div>
            <h2 className="text-base font-semibold text-text-primary">Region</h2>
          </div>
          <p className="text-sm text-text-secondary mb-4">Select the region closest to your users for the best performance.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {regions.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRegion(r.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all duration-150 ${
                  region === r.id
                    ? "border-accent bg-accent-muted/30 text-text-primary"
                    : "border-border bg-transparent text-text-secondary hover:border-border-light hover:bg-bg-tertiary"
                }`}
              >
                <span className="text-base">{r.flag}</span>
                <div>
                  <p className={`font-medium ${region === r.id ? "text-accent" : ""}`}>{r.name}</p>
                  <p className="text-xs text-text-muted font-mono">{r.id}</p>
                </div>
              </button>
            ))}
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
