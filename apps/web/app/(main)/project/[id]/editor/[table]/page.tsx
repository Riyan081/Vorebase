"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSchema, type TableInfo } from "@/lib/api";
import { IconTable, IconChevronLeft } from "@/lib/icons";
import TableViewContent from "@/components/table-editor/table-view-content";

export default function TableViewPage() {
  const params = useParams();
  const id = params.id as string;
  const tableName = params.table as string;

  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchema(id)
      .then(setTables)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const currentTable = tables.find((t) => t.name === tableName);

  if (!currentTable) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <IconTable size={48} className="text-text-muted" />
        <div className="text-center">
          <p className="text-lg font-medium text-text-primary mb-1">Table not found</p>
          <p className="text-sm text-text-secondary mb-4">
            The table <code className="text-accent font-mono">{tableName}</code> does not exist.
          </p>
          <Link
            href={`/project/${id}/editor`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-sm font-semibold transition-all"
          >
            <IconChevronLeft size={14} />
            Back to Editor
          </Link>
        </div>
      </div>
    );
  }

  return <TableViewContent projectId={id} tableName={tableName} />;
}
