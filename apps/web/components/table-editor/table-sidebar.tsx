"use client";

import Link from "next/link";
import { IconTable, IconPlus } from "@/lib/icons";
import type { TableInfo } from "@/lib/mock-data";

interface TableSidebarProps {
  tables: TableInfo[];
  selectedTable: string;
  onSelectTable?: (name: string) => void;
  projectId?: string;
  onCreateTable?: () => void;
  useLinks?: boolean;
}

export default function TableSidebar({
  tables,
  selectedTable,
  onSelectTable,
  projectId,
  onCreateTable,
  useLinks = false,
}: TableSidebarProps) {
  return (
    <div className="w-56 border-r border-border bg-bg-secondary flex flex-col flex-shrink-0">
      <div className="px-3 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Tables</h3>
          {onCreateTable && (
            <button
              onClick={onCreateTable}
              className="p-1 rounded-md text-text-muted hover:text-accent hover:bg-accent-muted/30 transition-all"
              title="Create table"
            >
              <IconPlus size={14} />
            </button>
          )}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {tables.map((table) =>
          useLinks && projectId ? (
            <Link
              key={table.name}
              href={`/project/${projectId}/editor/${table.name}`}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all duration-150 ${
                selectedTable === table.name
                  ? "bg-accent-muted/30 text-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
              }`}
            >
              <IconTable size={14} className="flex-shrink-0" />
              <span className="font-mono truncate">{table.name}</span>
              <span className="ml-auto text-[10px] text-text-muted">{table.rowCount}</span>
            </Link>
          ) : (
            <button
              key={table.name}
              onClick={() => onSelectTable?.(table.name)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all duration-150 ${
                selectedTable === table.name
                  ? "bg-accent-muted/30 text-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
              }`}
            >
              <IconTable size={14} className="flex-shrink-0" />
              <span className="font-mono truncate">{table.name}</span>
              <span className="ml-auto text-[10px] text-text-muted">{table.rowCount}</span>
            </button>
          )
        )}
      </nav>
    </div>
  );
}
