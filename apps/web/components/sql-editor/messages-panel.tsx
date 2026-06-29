"use client";

interface Message {
  type: "success" | "error" | "info";
  text: string;
}

interface MessagesPanelProps {
  messages: Message[];
}

const styles = {
  success: "bg-accent-muted/20 border-accent/20 text-accent",
  error: "bg-danger-muted/20 border-danger/20 text-danger",
  info: "bg-info-muted/20 border-info/20 text-info",
};

export default function MessagesPanel({ messages }: MessagesPanelProps) {
  if (messages.length === 0) return null;

  return (
    <div className="px-4 py-2 space-y-1 border-t border-border">
      {messages.map((msg, i) => (
        <div key={i} className={`px-3 py-2 rounded-lg border text-xs font-mono ${styles[msg.type]}`}>
          {msg.type === "error" && "✕ "}
          {msg.type === "success" && "✓ "}
          {msg.text}
        </div>
      ))}
    </div>
  );
}
