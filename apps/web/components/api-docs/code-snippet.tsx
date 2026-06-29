"use client";

import { useState } from "react";
import { IconCopy, IconCheck } from "@/lib/icons";

interface CodeSnippetProps {
  code: string;
  language: string;
}

export default function CodeSnippet({ code, language }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg bg-bg-primary border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-bg-secondary">
        <span className="text-[10px] font-mono text-text-muted uppercase">{language}</span>
        <button onClick={handleCopy} className="p-1 rounded text-text-muted hover:text-accent transition-colors">
          {copied ? <IconCheck size={12} className="text-accent" /> : <IconCopy size={12} />}
        </button>
      </div>
      <pre className="p-3 text-xs font-mono text-text-primary overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}
