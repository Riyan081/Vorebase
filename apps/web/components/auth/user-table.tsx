"use client";

import { IconClock, IconTrash } from "@/lib/icons";
import { formatDateTime, type AuthUser } from "@/lib/mock-data";

interface UserTableProps {
  users: AuthUser[];
  onDeleteUser?: (id: string) => void;
}

export default function UserTable({ users, onDeleteUser }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="py-12 text-center rounded-xl border border-border bg-bg-secondary">
        <p className="text-sm text-text-secondary">No users found</p>
      </div>
    );
  }

  return (
    <div className="table-scroll-wrapper rounded-xl border border-border bg-bg-secondary overflow-hidden">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="bg-bg-tertiary">
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Email</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Role</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Provider</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Last Sign In</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary">Created</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="group border-t border-border hover:bg-bg-tertiary/50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-xs font-semibold text-accent flex-shrink-0">
                    {user.email[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{user.email}</p>
                    <p className="text-xs text-text-muted font-mono">{user.id.slice(0, 8)}...</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.role === "admin" ? "bg-warning-muted text-warning" : "bg-accent-muted text-accent"
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">{user.provider}</td>
              <td className="px-4 py-3 text-sm text-text-secondary">
                {user.lastSignIn ? (
                  <span className="flex items-center gap-1">
                    <IconClock size={12} className="text-text-muted" />
                    {formatDateTime(user.lastSignIn)}
                  </span>
                ) : (
                  <span className="text-text-muted italic text-xs">Never</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">{formatDateTime(user.createdAt)}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onDeleteUser?.(user.id)}
                  className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger-muted transition-all opacity-0 group-hover:opacity-100"
                  title="Delete user"
                >
                  <IconTrash size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
