"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { IconCheck, IconX } from "@/lib/icons";

type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: React.ReactNode; text: string }> = {
  success: {
    bg: "bg-bg-secondary",
    border: "border-accent/30",
    icon: <IconCheck size={14} className="text-accent" />,
    text: "text-text-primary",
  },
  error: {
    bg: "bg-bg-secondary",
    border: "border-danger/30",
    icon: <span className="text-danger text-xs font-bold">✕</span>,
    text: "text-text-primary",
  },
  warning: {
    bg: "bg-bg-secondary",
    border: "border-warning/30",
    icon: <span className="text-warning text-xs font-bold">!</span>,
    text: "text-text-primary",
  },
  info: {
    bg: "bg-bg-secondary",
    border: "border-info/30",
    icon: <span className="text-info text-xs font-bold">i</span>,
    text: "text-text-primary",
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const style = variantStyles[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl max-w-sm w-full animate-slide-in-right ${style.bg} ${style.border}`}
    >
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
        {style.icon}
      </div>
      <p className={`text-sm flex-1 ${style.text}`}>{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-text-muted hover:text-text-secondary transition-colors flex-shrink-0"
      >
        <IconX size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
