"use client";

import { IconLogs, IconSearch, IconRefresh, IconShield } from "@/lib/icons";

/**
 * Logs View — Currently shows a "Coming Soon" state.
 * When the Logs API backend is implemented, this will fetch
 * real service logs from /rest/v1/logs or a dedicated endpoint.
 */
export default function LogsView() {
  return (
    <>
      <div className="flex items-center justify-end mb-6">
        <button
          disabled
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-muted text-xs font-medium cursor-not-allowed opacity-50"
        >
          <IconRefresh size={12} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-muted/20 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <IconLogs size={28} className="text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Service Logs
          </h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
            Real-time log aggregation from all Vorebase services (Auth, REST, Storage, Realtime).
            This feature will show request logs, error traces, and service health metrics.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning-muted/20 border border-warning/20">
            <IconShield size={14} className="text-warning" />
            <span className="text-xs text-warning font-medium">Coming Soon — Logs API under development</span>
          </div>

          <div className="mt-8 max-w-lg mx-auto">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Planned Features</p>
            <div className="grid grid-cols-2 gap-3 text-left">
              {[
                "Request / Response logs",
                "Error stack traces",
                "Auth event logs",
                "Storage access logs",
                "Query execution logs",
                "Real-time streaming",
                "Log level filtering",
                "Service-based filtering",
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-tertiary/50 border border-border"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted flex-shrink-0" />
                  <span className="text-xs text-text-secondary">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
