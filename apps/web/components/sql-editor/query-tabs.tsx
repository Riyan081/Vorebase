"use client";

import { useState } from "react";
import { IconPlus, IconX } from "@/lib/icons";

interface Tab {
  id: string;
  label: string;
}

interface QueryTabsProps {
  tabs: Tab[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
}

export default function QueryTabs({ tabs, activeTab, onSelectTab, onAddTab, onCloseTab }: QueryTabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border px-2 bg-bg-secondary overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`group flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-lg border-t border-x cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === tab.id
              ? "border-border bg-bg-primary text-text-primary"
              : "border-transparent text-text-muted hover:text-text-secondary"
          }`}
          onClick={() => onSelectTab(tab.id)}
        >
          {tab.label}
          {tabs.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-danger transition-all"
            >
              <IconX size={10} />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onAddTab}
        className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent-muted/30 transition-all ml-1"
        title="New query tab"
      >
        <IconPlus size={12} />
      </button>
    </div>
  );
}
