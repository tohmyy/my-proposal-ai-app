"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error";

type ToastEntry = {
  id: string;
  variant: ToastVariant;
  message: string;
};

const DURATIONS: Record<ToastVariant, number> = {
  success: 4000,
  error: 6000,
};

const ToastContext = createContext<{
  success: (message: string) => void;
  error: (message: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, variant, message }]);
      const timer = setTimeout(() => dismiss(id), DURATIONS[variant]);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const value = {
    success: useCallback((message: string) => show("success", message), [show]),
    error: useCallback((message: string) => show("error", message), [show]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="koya-toast-region" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === "error" ? "alert" : "status"}
            className={cn(
              "koya-toast animate-in-up",
              t.variant === "error"
                ? "border-rose-300 bg-rose-50 text-rose-900"
                : "border-teal-300 bg-teal-50 text-[var(--koya-ink)]",
            )}
          >
            {t.variant === "error" ? (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--koya-accent)]" />
            )}
            <p className="flex-1 text-sm">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="shrink-0 rounded p-0.5 text-current/60 transition hover:text-current"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
