"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import Sidebar from "@/components/layouts/sidebar";
import Header from "@/components/layouts/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.id as string;

  // Desktop: sidebar collapse state
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: sidebar open/close state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar
          projectId={projectId}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <Header
          projectId={projectId}
          collapsed={collapsed}
          onToggleCollapse={() => setMobileOpen(!mobileOpen)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
