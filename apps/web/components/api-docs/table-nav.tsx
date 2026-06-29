"use client";

import { IconTable } from "@/lib/icons";

interface TableNavProps {
  tables: string[];
  activeTable: string;
  onSelectTable: (name: string) => void;
}

export default function TableNav({ tables, activeTable, onSelectTable }: TableNavProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-6">
      {tables.map((table) => (
        <button
          key={table}
          onClick={() => onSelectTable(table)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-medium whitespace-nowrap transition-all ${
            activeTable === table
              ? "bg-accent-muted/30 text-accent border border-accent/20"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary border border-transparent"
          }`}
        >
          <IconTable size={12} />
          {table}
        </button>
      ))}
    </div>
  );
}
