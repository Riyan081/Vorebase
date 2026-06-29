import { mockRoles, type DbRole } from "@/lib/mock-data";
import { IconShield } from "@/lib/icons";

function RoleCard({ role }: { role: DbRole }) {
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
          <span className="font-semibold text-accent">Database roles</span> control which users and services
          can access your data. Roles work in conjunction with Row Level Security (RLS) policies to restrict
          data access.
        </p>
      </div>
      <div className="space-y-4">
        {mockRoles.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}
      </div>
    </>
  );
}
