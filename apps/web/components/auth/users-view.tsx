"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { listAuthUsers, deleteAuthUser, type AuthUser } from "@/lib/api";
import UserTable from "@/components/auth/user-table";
import CreateUserModal from "@/components/auth/create-user-modal";
import { useToast } from "@/components/shared/toast";
import { IconPlus, IconSearch } from "@/lib/icons";

const PAGE_SIZE = 20;

export default function UsersView() {
  const params = useParams();
  const projectId = params.id as string;
  const { showToast } = useToast();

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUsers = (page = currentPage) => {
    setLoading(true);
    listAuthUsers(projectId, page, PAGE_SIZE)
      .then((res) => {
        setUsers(res.data);
        setTotalCount(res.count);
        setTotalPages(res.total_pages);
        setCurrentPage(res.page);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (projectId) fetchUsers(1);
  }, [projectId]);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-secondary">
          {loading ? "Loading..." : `${totalCount} users in this project`}
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-sm font-semibold transition-all hover:shadow-glow"
        >
          <IconPlus size={14} />
          Add User
        </button>
      </div>

      <div className="relative mb-4">
        <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or role..."
          className="w-full max-w-sm pl-9 pr-4 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : (
        <UserTable
          users={filteredUsers}
          onDeleteUser={async (id) => {
            if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
            try {
              await deleteAuthUser(id);
              showToast("User deleted successfully", "success");
              fetchUsers();
            } catch (err) {
              const message = err instanceof Error ? err.message : "Failed to delete user";
              showToast(message, "error");
            }
          }}
        />
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-text-muted">
            Page {currentPage} of {totalPages} · Showing {users.length} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUsers(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-border text-text-secondary text-xs font-medium hover:bg-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>
            <button
              onClick={() => fetchUsers(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-border text-text-secondary text-xs font-medium hover:bg-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <CreateUserModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          fetchUsers();
        }}
        projectId={projectId}
      />
    </>
  );
}
