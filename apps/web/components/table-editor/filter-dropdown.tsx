"use client";

import { useState } from "react";
import { IconChevronDown } from "@/lib/icons";

interface FilterOption {
  column: string;
  operator: string;
  value: string;
}

const OPERATORS = ["eq", "neq", "gt", "lt", "gte", "lte", "like", "ilike", "is"];

interface FilterDropdownProps {
  columns: string[];
  onApply: (filter: FilterOption) => void;
  onClear: () => void;
}

export default function FilterDropdown({ columns, onApply, onClear }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [column, setColumn] = useState(columns[0] || "");
  const [operator, setOperator] = useState("eq");
  const [value, setValue] = useState("");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary text-xs font-medium transition-all"
      >
        Filter
        <IconChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-72 bg-bg-tertiary border border-border rounded-lg shadow-lg z-30 p-3 animate-scale-in">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Add Filter</p>
          <div className="space-y-2">
            <select
              value={column}
              onChange={(e) => setColumn(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            >
              {columns.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            >
              {OPERATORS.map((op) => <option key={op}>{op}</option>)}
            </select>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Value..."
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary placeholder:text-text-muted text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => { onClear(); setOpen(false); }}
              className="flex-1 px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-bg-secondary transition-all"
            >
              Clear
            </button>
            <button
              onClick={() => { onApply({ column, operator, value }); setOpen(false); }}
              className="flex-1 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-bg-primary text-xs font-semibold transition-all"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
