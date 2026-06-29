"use client";

import { useState } from "react";
import { mockTables } from "@/lib/mock-data";
import EndpointCard from "@/components/api-docs/endpoint-card";
import TableNav from "@/components/api-docs/table-nav";

export default function ApiDocsView({ projectId }: { projectId: string }) {
  const [activeTable, setActiveTable] = useState(mockTables[0]?.name || "");

  return (
    <>
      <div className="p-4 rounded-xl border border-border bg-bg-secondary mb-6">
        <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Base URL</p>
        <code className="text-sm font-mono text-accent">https://{projectId}.vorebase.co/rest/v1</code>
      </div>

      <TableNav
        tables={mockTables.map((t) => t.name)}
        activeTable={activeTable}
        onSelectTable={setActiveTable}
      />

      <div className="space-y-8">
        {mockTables.map((table) => (
          <div key={table.name} id={`table-${table.name}`}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-base font-semibold text-text-primary font-mono">{table.name}</h2>
              <span className="text-xs text-text-muted px-2 py-0.5 rounded-full bg-bg-secondary border border-border">
                {table.columns.length} columns
              </span>
            </div>
            <div className="space-y-2">
              <EndpointCard method="GET" path={`/rest/v1/${table.name}`} description={`Read rows from ${table.name}`} table={table.name} />
              <EndpointCard method="POST" path={`/rest/v1/${table.name}`} description={`Insert rows into ${table.name}`} table={table.name} />
              <EndpointCard method="PATCH" path={`/rest/v1/${table.name}`} description={`Update rows in ${table.name}`} table={table.name} />
              <EndpointCard method="DELETE" path={`/rest/v1/${table.name}`} description={`Delete rows from ${table.name}`} table={table.name} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
