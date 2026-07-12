"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getSchema, type TableInfo } from "@/lib/api";
import EndpointCard from "@/components/api-docs/endpoint-card";
import TableNav from "@/components/api-docs/table-nav";

export default function ApiDocsView({ projectId }: { projectId: string }) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [activeTable, setActiveTable] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchema(projectId)
      .then((schema) => {
        setTables(schema);
        if (schema.length > 0) setActiveTable(schema[0]!.name);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 rounded-xl border border-border bg-bg-secondary mb-6">
        <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Base URL</p>
        <code className="text-sm font-mono text-accent">https://{projectId}.vorebase.co/rest/v1</code>
      </div>

      <TableNav
        tables={tables.map((t) => t.name)}
        activeTable={activeTable}
        onSelectTable={setActiveTable}
      />

      <div className="space-y-8">
        {tables.map((table) => (
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
