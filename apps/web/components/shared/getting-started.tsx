
import Link from "next/link";
import { IconCheck, IconTable, IconUsers, IconFolder, IconCode, IconKey } from "@/lib/icons";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  done?: boolean;
}

interface GettingStartedProps {
  projectId: string;
}

export default function GettingStarted({ projectId }: GettingStartedProps) {
  const items: ChecklistItem[] = [
    {
      id: "table",
      label: "Create your first table",
      description: "Define your data schema with the Table Editor",
      icon: <IconTable size={16} className="text-accent" />,
      href: `/project/${projectId}/editor`,
    },
    {
      id: "sql",
      label: "Run a SQL query",
      description: "Query and manipulate your data with SQL",
      icon: <IconCode size={16} className="text-info" />,
      href: `/project/${projectId}/sql`,
    },
    {
      id: "auth",
      label: "Set up authentication",
      description: "Manage users and access policies",
      icon: <IconUsers size={16} className="text-warning" />,
      href: `/project/${projectId}/auth/users`,
    },
    {
      id: "storage",
      label: "Upload a file",
      description: "Store and serve files with Storage",
      icon: <IconFolder size={16} className="text-danger" />,
      href: `/project/${projectId}/storage`,
    },
    {
      id: "api",
      label: "Get your API keys",
      description: "Connect your app with the project API",
      icon: <IconKey size={16} className="text-accent" />,
      href: `/project/${projectId}/settings/api`,
    },
  ];

  return (
    <div className="p-6 rounded-xl border border-border bg-bg-secondary">
      <h2 className="text-base font-semibold text-text-primary mb-1">Getting Started</h2>
      <p className="text-sm text-text-secondary mb-4">Complete these steps to set up your project</p>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex items-center gap-4 p-3 rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-bg-tertiary group-hover:bg-bg-hover flex items-center justify-center flex-shrink-0 transition-colors">
              {item.done ? <IconCheck size={16} className="text-accent" /> : item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${item.done ? "text-text-muted line-through" : "text-text-primary"}`}>
                {item.label}
              </p>
              <p className="text-xs text-text-muted">{item.description}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              item.done ? "border-accent bg-accent" : "border-border"
            }`}>
              {item.done && <IconCheck size={10} className="text-bg-primary" />}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
