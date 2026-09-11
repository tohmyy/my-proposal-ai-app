"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dropdownMenuItemClass =
  "block w-full px-3 py-2 text-left text-sm font-medium text-[var(--koya-ink)] hover:bg-[var(--koya-mist)] disabled:opacity-50";

const DropdownMenuCloseContext = createContext<() => void>(() => {});

export function DropdownMenu({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        {label}
        <ChevronDown
          className={cn("h-4 w-4 transition", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && (
        <DropdownMenuCloseContext.Provider value={() => setOpen(false)}>
          <div
            id={menuId}
            role="menu"
            className="absolute right-0 z-20 mt-2 min-w-[13rem] rounded-lg border border-[var(--koya-line)] bg-white py-1 shadow-[0_12px_32px_-16px_rgba(12,18,34,0.45)]"
          >
            {children}
          </div>
        </DropdownMenuCloseContext.Provider>
      )}
    </div>
  );
}

export function DropdownMenuLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const close = useContext(DropdownMenuCloseContext);
  return (
    <Link role="menuitem" href={href} className={dropdownMenuItemClass} onClick={close}>
      {children}
    </Link>
  );
}

export function DropdownMenuAnchor({
  href,
  children,
  target,
  rel,
}: {
  href: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}) {
  const close = useContext(DropdownMenuCloseContext);
  return (
    <a
      role="menuitem"
      href={href}
      target={target}
      rel={rel}
      className={dropdownMenuItemClass}
      onClick={close}
    >
      {children}
    </a>
  );
}

export function DropdownMenuDivider() {
  return <div className="my-1 border-t border-[var(--koya-line)]" />;
}
