"use client";

import { useState } from "react";
import { mockExtensions, type DbExtension } from "@/lib/mock-data";

const categories = ["All", ...Array.from(new Set(mockExtensions.map((e) => e.category)))];

function ExtensionRow({
  ext,
  onToggle,
}: {
  ext: DbExtension;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-xl border border-border bg-bg-secondary hover:border-border-light transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <code className="text-sm font-bold font-mono text-text-primary">{ext.name}</code>
          <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg-tertiary font-mono">
            v{ext.version}
          </span>
          <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg-tertiary">
            {ext.category}
          </span>
        </div>
        <p className="text-sm text-text-secondary">{ext.description}</p>
      </div>
      <button
        onClick={() => onToggle(ext.id)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
          ext.enabled ? "bg-accent" : "bg-bg-tertiary border border-border"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            ext.enabled ? "left-[22px]" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function ExtensionsView() {
  const [extensions, setExtensions] = useState(mockExtensions);
  const [activeCategory, setActiveCategory] = useState("All");

  const toggleExtension = (extId: string) => {
    setExtensions((prev) =>
      prev.map((e) => (e.id === extId ? { ...e, enabled: !e.enabled } : e))
    );
  };

  const filtered =
    activeCategory === "All"
      ? extensions
      : extensions.filter((e) => e.category === activeCategory);

  return (
    <>
      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCategory === cat
                ? "bg-accent-muted/30 text-accent border border-accent/20"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary border border-transparent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((ext) => (
          <ExtensionRow key={ext.id} ext={ext} onToggle={toggleExtension} />
        ))}
      </div>
    </>
  );
}
