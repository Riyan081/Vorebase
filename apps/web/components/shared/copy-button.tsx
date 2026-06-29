"use client";

import { useState } from "react";
import { IconCopy, IconCheck } from "@/lib/icons";

interface CopyButtonProps {
  text: string;
  size?: "sm" | "md";
  className?: string;
}

export default function CopyButton({ text, size = "md", className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // fallback: select all text in the page
    }
  };

  const iconSize = size === "sm" ? 12 : 14;
  const btnSize = size === "sm" ? "p-1.5" : "p-2";

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy to clipboard"}
      className={`${btnSize} rounded-lg border border-border text-text-muted hover:text-accent hover:bg-accent-muted/30 transition-all duration-150 ${className}`}
    >
      {copied ? (
        <IconCheck size={iconSize} className="text-accent" />
      ) : (
        <IconCopy size={iconSize} />
      )}
    </button>
  );
}
