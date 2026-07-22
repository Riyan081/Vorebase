"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  VorebaseLogo, IconHome, IconTable, IconCode, IconUsers, IconShield,
  IconFolder, IconFileText, IconSettings, IconKey, IconLogs, IconDatabase,
  IconChevronLeft, IconChevronRight, IconLogOut,
} from "@/lib/icons";
import ProjectSelector from "@/components/layouts/project-selector";
import { getAdminUser, clearToken, getRefreshToken } from "@/lib/auth";

interface SidebarProps {
  projectId: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  section?: string;
}

export default function Sidebar({ projectId, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string>("Admin");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const user = getAdminUser();
    if (user?.email) setAdminEmail(user.email);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await fetch("/auth/v1/admin/signout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }).catch(() => {}); // best-effort — always clear local tokens
      }
    } finally {
      clearToken();
      router.push("/login");
    }
  };

  const navItems: NavItem[] = [
    { label: "Home", href: `/project/${projectId}`, icon: <IconHome size={18} /> },
    { label: "Table Editor", href: `/project/${projectId}/editor`, icon: <IconTable size={18} />, section: "Database" },
    { label: "SQL Editor", href: `/project/${projectId}/sql`, icon: <IconCode size={18} /> },
    { label: "Schema", href: `/project/${projectId}/database/tables`, icon: <IconDatabase size={18} /> },
    { label: "Roles", href: `/project/${projectId}/database/roles`, icon: <IconShield size={18} /> },
    { label: "Extensions", href: `/project/${projectId}/database/extensions`, icon: <IconKey size={18} /> },
    { label: "Auth Users", href: `/project/${projectId}/auth/users`, icon: <IconUsers size={18} />, section: "Authentication" },
    { label: "Policies", href: `/project/${projectId}/auth/policies`, icon: <IconShield size={18} /> },
    { label: "Storage", href: `/project/${projectId}/storage`, icon: <IconFolder size={18} />, section: "Storage" },
    { label: "API Docs", href: `/project/${projectId}/api`, icon: <IconFileText size={18} />, section: "API" },
    { label: "API Keys", href: `/project/${projectId}/settings/api`, icon: <IconKey size={18} /> },
    { label: "Logs", href: `/project/${projectId}/logs`, icon: <IconLogs size={18} />, section: "System" },
    { label: "Settings", href: `/project/${projectId}/settings/general`, icon: <IconSettings size={18} /> },
  ];

  const isActive = (href: string) => {
    if (href === `/project/${projectId}`) return pathname === href;
    return pathname.startsWith(href);
  };

  const initials = adminEmail.charAt(0).toUpperCase();
  let currentSection = "";

  return (
    <aside
      className={`flex flex-col h-full border-r border-border bg-bg-secondary transition-all duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border min-h-[52px]">
        {!collapsed && (
          <Link href="/projects" className="flex items-center gap-2 group">
            <VorebaseLogo size={24} />
            <span className="text-sm font-semibold text-text-primary tracking-tight group-hover:text-accent transition-colors">
              Vorebase
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/projects" className="mx-auto">
            <VorebaseLogo size={24} />
          </Link>
        )}
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-all duration-150"
          >
            <IconChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Project Selector */}
      <div className="px-3 py-3 border-b border-border">
        <ProjectSelector projectId={projectId} collapsed={collapsed} />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {navItems.map((item) => {
          const showSection = !collapsed && item.section && item.section !== currentSection;
          if (item.section) currentSection = item.section;

          return (
            <div key={item.href}>
              {showSection && (
                <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {item.section}
                </p>
              )}
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive(item.href)
                    ? "bg-accent-muted/30 text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-border px-3 py-3">
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-all duration-150"
          >
            <IconChevronRight size={14} />
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent flex-shrink-0">
                {initials}
              </div>
              <p className="text-xs text-text-secondary truncate">{adminEmail}</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger-muted transition-all duration-150 disabled:opacity-50"
              title="Sign out"
            >
              <IconLogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
