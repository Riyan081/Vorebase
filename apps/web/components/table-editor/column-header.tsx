"use client";

import type { TableColumn } from "@/lib/api";

interface ColumnHeaderProps {
  column: TableColumn;
}

export default function ColumnHeader({ column }: ColumnHeaderProps) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary border-b border-r border-border whitespace-nowrap">
      <div className="flex items-center gap-1.5">
        <span className="font-mono">{column.name}</span>
        {column.isPrimaryKey && (
          <span className="px-1 py-0.5 text-[9px] font-bold bg-accent-muted text-accent rounded">PK</span>
        )}
        <span className="text-[10px] text-text-muted font-normal">{column.type}</span>
      </div>
    </th>
  );
}
