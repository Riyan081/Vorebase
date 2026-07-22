"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getSchema, getTableRows, type TableInfo, type TableRow } from "@/lib/api";
import TableSidebar from "@/components/table-editor/table-sidebar";
import TableGrid from "@/components/table-editor/table-grid";
import CreateTableModal from "@/components/table-editor/create-table-modal";
import InsertRowPanel from "@/components/table-editor/insert-row-panel";
import FilterDropdown from "@/components/table-editor/filter-dropdown";
import SortDropdown from "@/components/table-editor/sort-dropdown";
import { IconPlus, IconSearch, IconRefresh, IconDatabase } from "@/lib/icons";

interface ActiveFilter { column: string; operator: string; value: string; }
interface ActiveSort { column: string; direction: "asc" | "desc"; }

export default function TableEditorView() {
  const params = useParams();
  const projectId = params.id as string;

  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [rows, setRows] = useState<TableRow[]>([]);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  const [activeSort, setActiveSort] = useState<ActiveSort | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch schema — re-runs on refresh so ALTER TABLE changes show up
  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    getSchema(projectId)
      .then((schema) => {
        setTables(schema);
        if (schema.length > 0 && !selectedTable) {
          setSelectedTable(schema[0]!.name);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, refreshKey]);

  // Fetch rows when table, filter, or sort changes — server-side filtering
  useEffect(() => {
    if (!projectId || !selectedTable) return;

    // Build query params for server-side filtering (Supabase-compatible format)
    const queryParams: Record<string, string> = {};

    if (activeFilter) {
      queryParams[activeFilter.column] = `${activeFilter.operator}.${activeFilter.value}`;
    }

    if (activeSort) {
      queryParams.order = `${activeSort.column}.${activeSort.direction}`;
    }

    getTableRows(projectId, selectedTable, Object.keys(queryParams).length > 0 ? queryParams : undefined)
      .then((res) => setRows(res.data))
      .catch(() => setRows([]));
  }, [projectId, selectedTable, refreshKey, activeFilter, activeSort]);

  const currentTable = tables.find((t) => t.name === selectedTable);

  const displayRows = rows;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <TableSidebar
        tables={tables}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
        onCreateTable={() => setShowCreateModal(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentTable ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-primary">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <IconDatabase size={14} className="text-accent" />
                  <span className="font-mono">{currentTable.name}</span>
                </h2>
                <span className="text-xs text-text-muted px-2 py-0.5 rounded-full bg-bg-secondary border border-border">
                  {currentTable.rowCount} rows
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter rows..."
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-xs w-48 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
                <FilterDropdown
                  columns={currentTable.columns.map((c) => c.name)}
                  onApply={(f) => setActiveFilter(f)}
                  onClear={() => setActiveFilter(null)}
                  activeFilter={activeFilter}
                />
                <SortDropdown
                  columns={currentTable.columns.map((c) => c.name)}
                  onApply={(s) => setActiveSort(s)}
                  onClear={() => setActiveSort(null)}
                  activeSort={activeSort}
                />
                <button
                  onClick={() => setShowInsertModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-xs font-semibold transition-all"
                >
                  <IconPlus size={12} />
                  Insert Row
                </button>
                <button
                  onClick={() => { setSearch(""); setActiveFilter(null); setActiveSort(null); setRefreshKey(k => k + 1); }}
                  title="Refresh"
                  className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary hover:bg-bg-secondary transition-all"
                >
                  <IconRefresh size={14} />
                </button>
              </div>
            </div>

            <TableGrid key={refreshKey} table={currentTable} rows={displayRows} search={search} projectId={projectId} onDataChanged={() => setRefreshKey((k) => k + 1)} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-text-secondary">Select a table to view its data</p>
          </div>
        )}
      </div>

      <CreateTableModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        onTableCreated={() => {
          // Refresh the schema to show the new table
          getSchema(projectId)
            .then((schema) => {
              setTables(schema);
              // Select the newly created table (last one)
              if (schema.length > 0) {
                setSelectedTable(schema[schema.length - 1]!.name);
              }
            })
            .catch(() => {});
        }}
      />
      <InsertRowPanel
        isOpen={showInsertModal}
        onClose={() => setShowInsertModal(false)}
        table={currentTable || null}
        projectId={projectId}
        onRowInserted={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
