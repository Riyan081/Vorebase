"use client";

import { IconCode, IconCopy, IconCheck, IconPlay } from "@/lib/icons";

interface SqlEditorProps {
  sql: string;
  onChange: (value: string) => void;
  onRun: () => void;
  isRunning: boolean;
  copied: boolean;
  onCopy: () => void;
}

export default function SqlEditor({
  sql,
  onChange,
  onRun,
  isRunning,
  copied,
  onCopy,
}: SqlEditorProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onRun();
    }
  };

  return (
    <div className="border-b border-border bg-bg-secondary">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <IconCode size={14} className="text-accent" />
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">SQL Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-tertiary transition-all"
            title="Copy SQL"
          >
            {copied ? <IconCheck size={14} className="text-accent" /> : <IconCopy size={14} />}
          </button>
          <button
            onClick={onRun}
            disabled={isRunning || !sql.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-bg-primary text-xs font-semibold transition-all"
          >
            {isRunning ? (
              <span className="w-3 h-3 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
            ) : (
              <IconPlay size={12} />
            )}
            {isRunning ? "Running..." : "Run"}
            <kbd className="ml-1 text-[9px] opacity-60">⌘↵</kbd>
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative">
        {/* Line Numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-bg-primary/50 border-r border-border flex flex-col items-end px-2 py-3 text-[11px] text-text-muted font-mono select-none">
          {sql.split("\n").map((_, i) => (
            <span key={i} className="leading-[1.6rem]">{i + 1}</span>
          ))}
        </div>
        <textarea
          value={sql}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[160px] pl-12 pr-4 py-3 bg-transparent text-text-primary font-mono text-sm leading-[1.6rem] resize-y focus:outline-none"
          placeholder="Enter your SQL query..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
