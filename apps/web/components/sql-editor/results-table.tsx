"use client";

import { IconCode, IconClock } from "@/lib/icons";

interface ResultsTableProps {
  results: Record<string, unknown>[];
  executionTime: number;
}

export default function ResultsTable({ results, executionTime }: ResultsTableProps) {
  const columns = results.length > 0 ? Object.keys(results[0]!) : [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-text-secondary">Results</span>
          <span className="text-xs text-text-muted">{results.length} rows returned</span>
        </div>
        <span className="text-xs text-text-muted flex items-center gap-1">
          <IconClock size={11} />
          {executionTime}ms
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {results.length > 0 ? (
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-bg-secondary sticky top-0 z-10">
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2 text-left text-xs font-semibold text-text-secondary border-b border-r border-border font-mono whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={i} className="hover:bg-bg-secondary/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2 text-sm font-mono text-text-primary border-b border-r border-border whitespace-nowrap max-w-[250px] truncate">
                      {row[col] === null ? (
                        <span className="text-text-muted italic text-xs">NULL</span>
                      ) : typeof row[col] === "boolean" ? (
                        <span className={`px-1.5 py-0.5 rounded text-xs ${row[col] ? "bg-accent-muted text-accent" : "bg-bg-tertiary text-text-muted"}`}>
                          {String(row[col])}
                        </span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <IconCode size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-secondary">Run a query to see results</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
