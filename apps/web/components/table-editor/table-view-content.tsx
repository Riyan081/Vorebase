"use client";

import { useState, useEffect } from "react";
import { getSchema, getTableRows, type TableInfo, type TableRow } from "@/lib/api";
import TableSidebar from "@/components/table-editor/table-sidebar";
import TableGrid from "@/components/table-editor/table-grid";
import InsertRowPanel from "@/components/table-editor/insert-row-panel";
import FilterDropdown from "@/components/table-editor/filter-dropdown";
import SortDropdown from "@/components/table-editor/sort-dropdown";
import { IconSearch, IconPlus, IconRefresh, IconDatabase } from "@/lib/icons";

interface ActiveFilter { column: string; operator: string; value: string; }
interface ActiveSort { column: string; direction: "asc" | "desc"; }

export default function TableViewContent({ projectId, tableName }: { projectId: string; tableName: string }) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [search, setSearch] = useState("");
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  const [activeSort, setActiveSort] = useState<ActiveSort | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch schema
  useEffect(() => {
    getSchema(projectId).then(setTables).catch(() => {});
  }, [projectId]);

  // Fetch rows
  useEffect(() => {
    if (!tableName) return;
    getTableRows(projectId, tableName)
      .then((res) => setRows(res.data))
      .catch(() => setRows([]));
  }, [projectId, tableName, refreshKey]);

  const currentTable = tables.find((t) => t.name === tableName);

  if (!currentTable && tables.length > 0) return null;

  // Apply filter
  const filteredRows = activeFilter
    ? rows.filter((row) => {
        const val = String(row[activeFilter.column] ?? "").toLowerCase();
        const filterVal = activeFilter.value.toLowerCase();
        switch (activeFilter.operator) {
          case "eq": return val === filterVal;
          case "neq": return val !== filterVal;
          case "gt": return parseFloat(val) > parseFloat(filterVal);
          case "lt": return parseFloat(val) < parseFloat(filterVal);
          case "gte": return parseFloat(val) >= parseFloat(filterVal);
          case "lte": return parseFloat(val) <= parseFloat(filterVal);
          case "like": return val.includes(filterVal);
          case "ilike": return val.includes(filterVal);
          case "is": return val === filterVal;
          default: return true;
        }
      })
    : rows;

  // Apply sort
  const displayRows = activeSort
    ? [...filteredRows].sort((a, b) => {
        const aVal = String(a[activeSort.column] ?? "");
        const bVal = String(b[activeSort.column] ?? "");
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
        return activeSort.direction === "asc" ? cmp : -cmp;
      })
    : filteredRows;

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <TableSidebar
        tables={tables}
        selectedTable={tableName}
        projectId={projectId}
        useLinks
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
            <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <InsertRowPanel isOpen={showInsertModal} onClose={() => setShowInsertModal(false)} table={currentTable || null} projectId={projectId} onRowInserted={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
}
