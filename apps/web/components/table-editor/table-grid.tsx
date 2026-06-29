"use client";

import { IconTable, IconEdit, IconTrash } from "@/lib/icons";
import ColumnHeader from "@/components/table-editor/column-header";
import type { TableInfo, TableRow } from "@/lib/mock-data";

interface TableGridProps {
  table: TableInfo;
  rows: TableRow[];
  search: string;
}

export default function TableGrid({ table, rows, search }: TableGridProps) {
  const filteredRows = rows.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <>
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-bg-secondary sticky top-0 z-10">
              <th className="w-10 px-3 py-2.5 border-b border-r border-border">
                <input type="checkbox" className="rounded border-border accent-accent" />
              </th>
              {table.columns.map((col) => (
                <ColumnHeader key={col.name} column={col} />
              ))}
              <th className="w-20 px-3 py-2.5 text-left text-xs font-semibold text-text-secondary border-b border-border">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, i) => (
              <tr key={i} className="group hover:bg-bg-secondary/50 transition-colors">
                <td className="px-3 py-2 border-b border-r border-border">
                  <input type="checkbox" className="rounded border-border accent-accent" />
                </td>
                {table.columns.map((col) => (
                  <td
                    key={col.name}
                    className="px-4 py-2 text-sm font-mono text-text-primary border-b border-r border-border whitespace-nowrap max-w-[250px] truncate"
                  >
                    {row[col.name] === null ? (
                      <span className="text-text-muted italic text-xs">NULL</span>
                    ) : typeof row[col.name] === "boolean" ? (
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          row[col.name] ? "bg-accent-muted text-accent" : "bg-bg-tertiary text-text-muted"
                        }`}
                      >
                        {String(row[col.name])}
                      </span>
                    ) : (
                      String(row[col.name])
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 border-b border-border">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 rounded text-text-muted hover:text-accent hover:bg-accent-muted/30 transition-all" title="Edit">
                      <IconEdit size={13} />
                    </button>
                    <button className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger-muted transition-all" title="Delete">
                      <IconTrash size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <IconTable size={32} className="text-text-muted mb-3" />
            <p className="text-sm font-medium text-text-primary mb-1">No rows found</p>
            <p className="text-xs text-text-secondary">
              {search ? "Try a different filter" : "This table is empty. Insert a row to get started."}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border bg-bg-secondary flex items-center justify-between text-xs text-text-muted">
        <span>Showing {filteredRows.length} of {rows.length} rows</span>
        <span className="font-mono">{table.columns.length} columns</span>
      </div>
    </>
  );
}
