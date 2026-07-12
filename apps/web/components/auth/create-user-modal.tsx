"use client";

import { useState } from "react";
import { IconX } from "@/lib/icons";
import { createAuthUser } from "@/lib/api";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export default function CreateUserModal({ isOpen, onClose, projectId }: CreateUserModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("authenticated");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!email || !password || !projectId) return;
    setError("");
    setIsLoading(true);
    try {
      await createAuthUser(projectId, email, password, role);
      setEmail("");
      setPassword("");
      setRole("authenticated");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-bg-secondary border border-border rounded-xl shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">Add New User</h2>
          <button onClick={onClose} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all">
            <IconX size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-danger-muted/20 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-input border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            >
              <option>authenticated</option>
              <option>admin</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-tertiary transition-all">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={isLoading || !email || !password}
            className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-bg-primary text-sm font-semibold transition-all"
          >
            {isLoading ? "Creating..." : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}
