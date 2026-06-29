"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SettingsLayoutProps {
  projectId: string;
  children: React.ReactNode;
}

const settingsNavItems = (projectId: string) => [
  { label: "General", href: `/project/${projectId}/settings/general` },
  { label: "API", href: `/project/${projectId}/settings/api` },
  { label: "Danger Zone", href: `/project/${projectId}/settings/danger`, danger: true },
];

export function SettingsNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const items = settingsNavItems(projectId);

  return (
    <div className="flex items-center gap-1 border-b border-border mb-6 -mx-6 px-6">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
            pathname === item.href || pathname.startsWith(item.href)
              ? item.danger ? "border-danger text-danger" : "border-accent text-accent"
              : "border-transparent text-text-muted hover:text-text-secondary"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
