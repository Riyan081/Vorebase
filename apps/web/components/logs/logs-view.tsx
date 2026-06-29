"use client";

import { useState } from "react";
import { mockLogs, formatDateTime } from "@/lib/mock-data";
import { IconLogs, IconSearch, IconRefresh } from "@/lib/icons";

const levelStyles: Record<string, { bg: string; text: string; dot: string }> = {
  info: { bg: "bg-info-muted", text: "text-info", dot: "bg-info" },
  warn: { bg: "bg-warning-muted", text: "text-warning", dot: "bg-warning" },
  error: { bg: "bg-danger-muted", text: "text-danger", dot: "bg-danger" },
  debug: { bg: "bg-bg-tertiary", text: "text-text-muted", dot: "bg-text-muted" },
};

export default function LogsView() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  const services = [...new Set(mockLogs.map((l) => l.service))];

  const filteredLogs = mockLogs.filter((log) => {
    const matchSearch = log.message.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === "all" || log.level === levelFilter;
    const matchService = serviceFilter === "all" || log.service === serviceFilter;
    return matchSearch && matchLevel && matchService;
  });

  return (
    <>
      <div className="flex items-center justify-end mb-6">
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary text-xs font-medium transition-all">
          <IconRefresh size={12} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="pl-8 pr-4 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary placeholder:text-text-muted text-sm w-64 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
        >
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
        </select>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
        >
          <option value="all">All Services</option>
          {services.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
        <div className="divide-y divide-border">
          {filteredLogs.map((log) => {
            const style = levelStyles[log.level]!;
            return (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-bg-tertiary/30 transition-colors">
                <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${style.bg} ${style.text}`}>
                      {log.level}
                    </span>
                    <span className="text-xs font-mono text-text-muted px-1.5 py-0.5 rounded bg-bg-tertiary">
                      {log.service}
                    </span>
                    <span className="text-[11px] text-text-muted ml-auto flex-shrink-0">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary font-mono leading-relaxed">{log.message}</p>
                </div>
              </div>
            );
          })}
        </div>
        {filteredLogs.length === 0 && (
          <div className="py-12 text-center">
            <IconLogs size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No logs match your filters</p>
          </div>
        )}
      </div>
    </>
  );
}
