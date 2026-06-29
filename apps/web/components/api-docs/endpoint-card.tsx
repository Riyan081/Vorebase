"use client";

import { useState } from "react";
import { IconCopy, IconCheck, IconChevronDown } from "@/lib/icons";
import CodeSnippet from "@/components/api-docs/code-snippet";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
type TabType = "javascript" | "curl";

const methodColors: Record<string, string> = {
  GET: "bg-info-muted text-info",
  POST: "bg-accent-muted text-accent",
  PATCH: "bg-warning-muted text-warning",
  DELETE: "bg-danger-muted text-danger",
};

const jsSnippets = (table: string): Record<string, string> => ({
  GET: `const { data, error } = await vorebase\n  .from('${table}')\n  .select('*')\n  .limit(10)`,
  POST: `const { data, error } = await vorebase\n  .from('${table}')\n  .insert({ column: 'value' })`,
  PATCH: `const { data, error } = await vorebase\n  .from('${table}')\n  .update({ column: 'new_value' })\n  .eq('id', 1)`,
  DELETE: `const { data, error } = await vorebase\n  .from('${table}')\n  .delete()\n  .eq('id', 1)`,
});

const curlSnippets = (table: string): Record<string, string> => ({
  GET: `curl 'https://your-project.vorebase.co/rest/v1/${table}?select=*&limit=10' \\\n  -H "apikey: YOUR_ANON_KEY" \\\n  -H "Authorization: Bearer YOUR_JWT"`,
  POST: `curl -X POST 'https://your-project.vorebase.co/rest/v1/${table}' \\\n  -H "apikey: YOUR_ANON_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"column": "value"}'`,
  PATCH: `curl -X PATCH 'https://your-project.vorebase.co/rest/v1/${table}?id=eq.1' \\\n  -H "apikey: YOUR_ANON_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"column": "new_value"}'`,
  DELETE: `curl -X DELETE 'https://your-project.vorebase.co/rest/v1/${table}?id=eq.1' \\\n  -H "apikey: YOUR_ANON_KEY"`,
});

interface EndpointCardProps {
  method: HttpMethod;
  path: string;
  description: string;
  table: string;
}

export default function EndpointCard({ method, path, description, table }: EndpointCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("javascript");

  return (
    <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-bg-tertiary/30 transition-colors"
      >
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${methodColors[method]}`}>{method}</span>
        <code className="text-sm font-mono text-text-primary flex-1 text-left">{path}</code>
        <span className="text-xs text-text-muted hidden sm:block">{description}</span>
        <IconChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-5 py-4 border-t border-border animate-fade-in space-y-3">
          <p className="text-sm text-text-secondary">{description}</p>
          <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-0.5 w-fit">
            {(["javascript", "curl"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab ? "bg-bg-secondary text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {tab === "javascript" ? "JavaScript" : "cURL"}
              </button>
            ))}
          </div>
          <CodeSnippet
            code={activeTab === "javascript" ? (jsSnippets(table)[method] ?? "") : (curlSnippets(table)[method] ?? "")}
            language={activeTab === "javascript" ? "javascript" : "bash"}
          />
        </div>
      )}
    </div>
  );
}
