"use client";

import { useState } from "react";
import { mockTables, mockTableRows } from "@/lib/mock-data";
import TableSidebar from "@/components/table-editor/table-sidebar";
import TableGrid from "@/components/table-editor/table-grid";
import CreateTableModal from "@/components/table-editor/create-table-modal";
import InsertRowPanel from "@/components/table-editor/insert-row-panel";
import FilterDropdown from "@/components/table-editor/filter-dropdown";
import SortDropdown from "@/components/table-editor/sort-dropdown";
import { IconPlus, IconSearch, IconRefresh, IconDatabase } from "@/lib/icons";

export default function TableEditorView() {
  const [selectedTable, setSelectedTable] = useState<string>(mockTables[0]?.name || "");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInsertModal, setShowInsertModal] = useState(false);

  const currentTable = mockTables.find((t) => t.name === selectedTable);
  const rows = mockTableRows[selectedTable] || [];

  return (
    <div className="flex h-full">
      <TableSidebar
        tables={mockTables}
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
                <FilterDropdown columns={currentTable.columns.map((c) => c.name)} onApply={() => {}} onClear={() => {}} />
                <SortDropdown columns={currentTable.columns.map((c) => c.name)} onApply={() => {}} onClear={() => {}} />
                <button
                  onClick={() => setShowInsertModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-xs font-semibold transition-all"
                >
                  <IconPlus size={12} />
                  Insert Row
                </button>
                <button className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary hover:bg-bg-secondary transition-all">
                  <IconRefresh size={14} />
                </button>
              </div>
            </div>

            <TableGrid table={currentTable} rows={rows} search={search} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-text-secondary">Select a table to view its data</p>
          </div>
        )}
      </div>

      <CreateTableModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <InsertRowPanel isOpen={showInsertModal} onClose={() => setShowInsertModal(false)} table={currentTable || null} />
    </div>
  );
}
