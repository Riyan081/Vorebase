"use client";

import { useState, useEffect, useRef } from "react";
import { IconChevronDown } from "@/lib/icons";

interface SortOption {
  column: string;
  direction: "asc" | "desc";
}

interface SortDropdownProps {
  columns: string[];
  onApply: (sort: SortOption) => void;
  onClear: () => void;
  activeSort?: SortOption | null;
}

export default function SortDropdown({ columns, onApply, onClear, activeSort }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const [column, setColumn] = useState(columns[0] || "");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const ref = useRef<HTMLDivElement>(null);

  // Sync state when activeSort changes
  useEffect(() => {
    if (activeSort) { setColumn(activeSort.column); setDirection(activeSort.direction); }
  }, [activeSort]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          activeSort
            ? "border-accent bg-accent-muted/20 text-accent"
            : "border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
        }`}
      >
        Sort{activeSort && " ●"}
        <IconChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-bg-tertiary border border-border rounded-lg shadow-lg z-30 p-3 animate-scale-in">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Sort By</p>
          <div className="space-y-2">
            <select
              value={column}
              onChange={(e) => setColumn(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
            >
              {columns.map((c) => <option key={c}>{c}</option>)}
            </select>
            <div className="flex gap-2">
              {(["asc", "desc"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    direction === d
                      ? "bg-accent text-bg-primary"
                      : "border border-border text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  {d === "asc" ? "A → Z" : "Z → A"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => { onClear(); setDirection("asc"); setOpen(false); }}
              className="flex-1 px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-bg-secondary transition-all"
            >
              Clear
            </button>
            <button
              onClick={() => { onApply({ column, direction }); setOpen(false); }}
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
