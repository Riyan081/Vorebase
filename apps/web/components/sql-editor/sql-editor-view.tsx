"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { executeSQL } from "@/lib/api";
import SqlEditor from "@/components/sql-editor/editor";
import ResultsTable from "@/components/sql-editor/results-table";
import QueryTabs from "@/components/sql-editor/query-tabs";
import MessagesPanel from "@/components/sql-editor/messages-panel";
import { IconX } from "@/lib/icons";

interface QueryHistoryItem {
  id: string;
  sql: string;
  executedAt: string;
  duration: number;
  rowsAffected: number;
}

export default function SqlEditorView() {
  const params = useParams();
  const projectId = params.id as string;

  const [sql, setSql] = useState("SELECT * FROM users LIMIT 10;");
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [executionTime, setExecutionTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [tabs, setTabs] = useState([{ id: "1", label: "Query 1" }]);
  const [activeTab, setActiveTab] = useState("1");
  const [messages, setMessages] = useState<{ type: "success" | "error" | "info"; text: string }[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const tabCounter = useRef(1);

  const handleRun = async () => {
    setIsRunning(true);
    setMessages([]);
    const start = performance.now();
    try {
      const res = await executeSQL(projectId, sql);
      const duration = Math.round(performance.now() - start);
      const resultRows = Array.isArray(res.data) ? res.data : [];
      setResults(resultRows);
      setExecutionTime(duration);

      // Detect if this was a DDL/DML query (no SELECT-like columns in result)
      const isDdl = resultRows.length > 0 && "affected_rows" in resultRows[0];
      const successMsg = isDdl
        ? `Query executed successfully in ${duration}ms`
        : `Query returned ${resultRows.length} row(s) in ${duration}ms`;

      setMessages([{ type: "success", text: successMsg }]);

      // Add to local history
      setQueryHistory((prev) => [
        {
          id: `q_${Date.now()}`,
          sql,
          executedAt: new Date().toISOString(),
          duration,
          rowsAffected: resultRows.length,
        },
        ...prev,
      ]);
    } catch (err: unknown) {
      const duration = Math.round(performance.now() - start);
      setExecutionTime(duration);
      setMessages([{ type: "error", text: err instanceof Error ? err.message : "Query execution failed" }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addTab = () => {
    tabCounter.current += 1;
    const newId = String(tabCounter.current);
    setTabs([...tabs, { id: newId, label: `Query ${newId}` }]);
    setActiveTab(newId);
  };

  const closeTab = (id: string) => {
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTab === id) setActiveTab(remaining[0]?.id || "");
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <QueryTabs tabs={tabs} activeTab={activeTab} onSelectTab={setActiveTab} onAddTab={addTab} onCloseTab={closeTab} />
        <SqlEditor sql={sql} onChange={setSql} onRun={handleRun} isRunning={isRunning} copied={copied} onCopy={handleCopy} />
        <MessagesPanel messages={messages} />
        <ResultsTable results={results} executionTime={executionTime} />
      </div>

      {/* Query History Sidebar */}
      {showHistory && (
        <div className="w-64 border-l border-border bg-bg-secondary flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between px-3 py-3 border-b border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">History</h3>
            <button onClick={() => setShowHistory(false)} className="p-1 rounded-md text-text-muted hover:text-text-primary transition-all" title="Close history">
              <IconX size={12} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {queryHistory.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-text-muted">Run a query to see history</p>
              </div>
            ) : (
              queryHistory.map((query) => (
                <button
                  key={query.id}
                  onClick={() => setSql(query.sql)}
                  className="w-full text-left px-3 py-3 border-b border-border hover:bg-bg-tertiary transition-colors"
                >
                  <pre className="text-[11px] font-mono text-text-primary truncate mb-1">{query.sql}</pre>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <span>{query.duration}ms</span>
                    <span>•</span>
                    <span>{query.rowsAffected} rows</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
