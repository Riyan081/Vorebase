"use client";

import { IconShield } from "@/lib/icons";

/**
 * Vorebase Roles — These are the ACTUAL roles used by the platform,
 * not PostgreSQL mock roles. Roles are used by RLS policies and
 * the auth system to control access.
 */
const vorebaseRoles = [
  {
    id: "anon",
    name: "anon",
    description:
      "The anonymous role. Used when a request is made with only an API key (no JWT). RLS policies targeting this role control what unauthenticated users can see.",
    permissions: ["SELECT (with RLS)", "INSERT (with RLS)"],
    color: "bg-warning-muted text-warning",
    isDefault: true,
  },
  {
    id: "authenticated",
    name: "authenticated",
    description:
      "The default role for signed-in users. After a successful signIn(), the JWT contains role='authenticated'. RLS policies can use auth.uid() to restrict rows to the current user.",
    permissions: ["SELECT (with RLS)", "INSERT (with RLS)", "UPDATE (with RLS)", "DELETE (with RLS)"],
    color: "bg-accent-muted text-accent",
    isDefault: true,
  },
  {
    id: "service_role",
    name: "service_role",
    description:
      "The admin role that bypasses ALL RLS policies. Used by the service_role API key for server-side operations. Never expose this key in client-side code.",
    permissions: ["SELECT (bypass RLS)", "INSERT (bypass RLS)", "UPDATE (bypass RLS)", "DELETE (bypass RLS)", "RAW SQL"],
    color: "bg-danger-muted text-danger",
    isDefault: true,
  },
];

function RoleCard({ role }: { role: (typeof vorebaseRoles)[number] }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-bg-secondary hover:border-border-light transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <code className={`px-2.5 py-1 rounded-lg text-sm font-bold font-mono ${role.color}`}>
            {role.name}
          </code>
          {role.isDefault && (
            <span className="px-2 py-0.5 rounded-full bg-bg-tertiary text-text-muted text-xs font-medium">
              built-in
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-text-secondary mb-3">{role.description}</p>
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Permissions</p>
        <div className="flex flex-wrap gap-2">
          {role.permissions.map((perm) => (
            <span
              key={perm}
              className="px-2 py-1 rounded-lg bg-bg-tertiary border border-border text-xs text-text-secondary font-mono"
            >
              {perm}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RolesList() {
  return (
    <>
      <div className="p-4 rounded-xl border border-accent/20 bg-accent-muted/10 mb-6">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-accent">Vorebase roles</span> control which users and services
          can access your data. Roles work in conjunction with Row Level Security (RLS) policies to restrict
          data access. These roles are assigned via JWT tokens and API keys.
        </p>
      </div>
      <div className="space-y-4">
        {vorebaseRoles.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}
      </div>
    </>
  );
}
