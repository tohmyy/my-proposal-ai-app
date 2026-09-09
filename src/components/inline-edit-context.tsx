"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type InlineEditContextValue = {
  activeId: string | null;
  activate: (id: string) => void;
  deactivateIfActive: (id: string) => void;
};

const InlineEditContext = createContext<InlineEditContextValue | null>(null);

export function InlineEditProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activate = useCallback((id: string) => setActiveId(id), []);
  const deactivateIfActive = useCallback((id: string) => {
    setActiveId((current) => (current === id ? null : current));
  }, []);

  return (
    <InlineEditContext.Provider value={{ activeId, activate, deactivateIfActive }}>
      {children}
    </InlineEditContext.Provider>
  );
}

export function useInlineEditSlot<T extends HTMLElement>(id: string) {
  const ctx = useContext(InlineEditContext);
  if (!ctx) {
    throw new Error("useInlineEditSlot must be used within an InlineEditProvider");
  }

  const isActive = ctx.activeId === id;
  const ref = useRef<T | null>(null);
  const open = useCallback(() => ctx.activate(id), [ctx, id]);
  const close = useCallback(() => ctx.deactivateIfActive(id), [ctx, id]);

  useEffect(() => {
    if (!isActive) return;

    // Listens for "click" rather than "mousedown" so hit-testing for a click
    // on a different editable field happens before we react to it — closing
    // this editor first (e.g. on mousedown) can reflow the page and shift
    // that other field out from under the pointer before its own click lands.
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isActive, close]);

  return { isActive, open, close, ref };
}
