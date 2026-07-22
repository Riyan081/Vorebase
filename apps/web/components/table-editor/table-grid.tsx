"use client";

import { useState } from "react";
import { IconTable, IconTrash, IconCheck, IconX } from "@/lib/icons";
import ColumnHeader from "@/components/table-editor/column-header";
import CellEditor from "@/components/table-editor/cell-editor";
import type { TableInfo, TableRow } from "@/lib/api";
import { updateRow, deleteRows } from "@/lib/api";

interface TableGridProps {
  table: TableInfo;
  rows: TableRow[];
  search: string;
  projectId: string;
  onDataChanged?: () => void;
}

export default function TableGrid({ table, rows, search, projectId, onDataChanged }: TableGridProps) {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colName: string } | null>(null);
  const [pendingEdits, setPendingEdits] = useState<Record<number, Record<string, unknown>>>({});
  const [savingRow, setSavingRow] = useState<number | null>(null);
  const [deletingRow, setDeletingRow] = useState<number | null>(null);
  const [error, setError] = useState("");

  const filteredRows = rows.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  // Find the primary key column
  const pkCol = table.columns.find((c) => c.isPrimaryKey);

  const handleCellSave = (rowIndex: number, colName: string, newValue: string) => {
    setPendingEdits((prev) => ({
      ...prev,
      [rowIndex]: { ...(prev[rowIndex] ?? {}), [colName]: newValue },
    }));
    setEditingCell(null);
  };

  const handleSaveRow = async (rowIndex: number, row: TableRow) => {
    const edits = pendingEdits[rowIndex];
    if (!edits || Object.keys(edits).length === 0) return;
    if (!pkCol) {
      setError("Cannot update: no primary key column detected.");
      return;
    }
    const pkValue = String(row[pkCol.name]);
    setSavingRow(rowIndex);
    setError("");
    try {
      await updateRow(projectId, table.name, { [`${pkCol.name}`]: `eq.${pkValue}` }, edits);
      setPendingEdits((prev) => { const next = { ...prev }; delete next[rowIndex]; return next; });
      onDataChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update row");
    } finally {
      setSavingRow(null);
    }
  };

  const handleDiscardRow = (rowIndex: number) => {
    setPendingEdits((prev) => { const next = { ...prev }; delete next[rowIndex]; return next; });
    setEditingCell(null);
  };

  const handleDeleteRow = async (rowIndex: number, row: TableRow) => {
    if (!pkCol) {
      setError("Cannot delete: no primary key column detected.");
      return;
    }
    if (!confirm("Delete this row? This cannot be undone.")) return;
    const pkValue = String(row[pkCol.name]);
    setDeletingRow(rowIndex);
    setError("");
    try {
      await deleteRows(projectId, table.name, { [`${pkCol.name}`]: `eq.${pkValue}` });
      onDataChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete row");
    } finally {
      setDeletingRow(null);
    }
  };

  return (
    <>
      {error && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-danger-muted/20 border border-danger/20 text-danger text-xs">
          {error}
        </div>
      )}
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
              <th className="w-28 px-3 py-2.5 text-left text-xs font-semibold text-text-secondary border-b border-border">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, i) => {
              const hasPendingEdits = !!pendingEdits[i] && Object.keys(pendingEdits[i]!).length > 0;
              const isSaving = savingRow === i;
              const isDeleting = deletingRow === i;
              return (
                <tr
                  key={i}
                  className={`group transition-colors ${hasPendingEdits ? "bg-accent-muted/10 border-l-2 border-l-accent" : "hover:bg-bg-secondary/50"}`}
                >
                  <td className="px-3 py-2 border-b border-r border-border">
                    <input type="checkbox" className="rounded border-border accent-accent" />
                  </td>
                  {table.columns.map((col) => {
                    const isEditing = editingCell?.rowIndex === i && editingCell?.colName === col.name;
                    const displayValue = pendingEdits[i]?.[col.name] !== undefined
                      ? pendingEdits[i]![col.name]
                      : row[col.name];
                    const isEditable = !col.isPrimaryKey;

                    return (
                      <td
                        key={col.name}
                        className="relative px-4 py-2 text-sm font-mono text-text-primary border-b border-r border-border whitespace-nowrap max-w-[250px] truncate"
                        onDoubleClick={() => isEditable && setEditingCell({ rowIndex: i, colName: col.name })}
                        title={isEditable ? "Double-click to edit" : undefined}
                      >
                        {isEditing ? (
                          <CellEditor
                            value={displayValue}
                            columnType={col.type}
                            onSave={(v) => handleCellSave(i, col.name, v)}
                            onCancel={() => setEditingCell(null)}
                          />
                        ) : displayValue === null ? (
                          <span className="text-text-muted italic text-xs">NULL</span>
                        ) : typeof displayValue === "boolean" ? (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${displayValue ? "bg-accent-muted text-accent" : "bg-bg-tertiary text-text-muted"}`}>
                            {String(displayValue)}
                          </span>
                        ) : (
                          <span className={pendingEdits[i]?.[col.name] !== undefined ? "text-warning" : ""}>
                            {String(displayValue)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 border-b border-border">
                    <div className="flex items-center gap-1">
                      {hasPendingEdits ? (
                        <>
                          <button
                            onClick={() => handleSaveRow(i, row)}
                            disabled={isSaving}
                            className="p-1 rounded text-accent hover:bg-accent-muted/30 transition-all disabled:opacity-50"
                            title="Save changes"
                          >
                            {isSaving
                              ? <span className="w-3 h-3 border border-accent/30 border-t-accent rounded-full animate-spin block" />
                              : <IconCheck size={13} />}
                          </button>
                          <button
                            onClick={() => handleDiscardRow(i)}
                            className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger-muted transition-all"
                            title="Discard changes"
                          >
                            <IconX size={13} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDeleteRow(i, row)}
                          disabled={isDeleting || !pkCol}
                          className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger-muted transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                          title={pkCol ? "Delete row" : "No primary key — cannot delete"}
                        >
                          {isDeleting
                            ? <span className="w-3 h-3 border border-danger/30 border-t-danger rounded-full animate-spin block" />
                            : <IconTrash size={13} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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
        <span>
          Showing {filteredRows.length} of {rows.length} rows
          {Object.keys(pendingEdits).length > 0 && (
            <span className="ml-2 text-warning">· {Object.keys(pendingEdits).length} unsaved change(s) — double-click a cell to edit</span>
          )}
        </span>
        <span className="font-mono">{table.columns.length} columns</span>
      </div>
    </>
  );
}
