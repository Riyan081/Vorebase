"use client";

import { useState } from "react";

interface CellEditorProps {
  value: unknown;
  columnType: string;
  onSave: (newValue: string) => void;
  onCancel: () => void;
}

export default function CellEditor({ value, columnType, onSave, onCancel }: CellEditorProps) {
  const [editValue, setEditValue] = useState(value === null ? "" : String(value));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSave(editValue);
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center px-1">
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(editValue)}
        autoFocus
        className="w-full px-2 py-1 rounded bg-bg-input border border-accent text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
        placeholder={`Enter ${columnType}...`}
      />
    </div>
  );
}
