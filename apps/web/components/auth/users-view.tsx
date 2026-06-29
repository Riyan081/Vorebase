"use client";

import { useState } from "react";
import { mockAuthUsers } from "@/lib/mock-data";
import UserTable from "@/components/auth/user-table";
import CreateUserModal from "@/components/auth/create-user-modal";
import { IconPlus, IconSearch } from "@/lib/icons";

export default function UsersView() {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredUsers = mockAuthUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-secondary">{mockAuthUsers.length} users in this project</p>
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

      <UserTable users={filteredUsers} />
      <CreateUserModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </>
  );
}
