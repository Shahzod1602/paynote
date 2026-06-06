"use client";

import { useEffect } from "react";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Bottom sheet — mobile-first modal that respects the Telegram theme. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="tma-card animate-float-up relative w-full max-w-md rounded-t-3xl border-t p-5 pb-8 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full" style={{ background: "var(--tg-separator)" }} />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="tma-text text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="close"
            className="tma-hint grid h-8 w-8 place-items-center rounded-lg text-xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="tma-hint mb-1.5 block text-sm font-medium">{label}</span>
      <input
        {...props}
        onWheel={(e) => (e.target as HTMLInputElement).blur()}
        className="tma-field w-full rounded-xl border px-3.5 py-3 text-base outline-none transition focus:border-[var(--tg-button)]"
      />
    </label>
  );
}

export function PrimaryButton({
  children,
  loading,
  ...props
}: { loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`tma-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition active:scale-[0.99] ${props.className ?? ""}`}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-rose-100 text-rose-700",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status] ?? ""}`}>
      {label}
    </span>
  );
}

/** Round avatar with the customer's initials. */
export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold"
      style={{ background: "color-mix(in srgb, var(--tg-button) 15%, transparent)", color: "var(--tg-button)" }}
    >
      {initials || "?"}
    </div>
  );
}
