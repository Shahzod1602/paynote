"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { adjustBalanceAction, toggleBlockUserAction } from "@/lib/actions/admin";
import type { AdminActionState } from "@/lib/actions/admin";

type Dict = {
  search: string;
  viewDetails: string;
  blocked: string;
  active: string;
  block: string;
  unblock: string;
  addBalance: string;
  subtractBalance: string;
  balanceAmount: string;
  balanceNote: string;
  balanceSubmit: string;
  confirmBlock: string;
  confirmUnblock: string;
  insufficientBalance: string;
};

export function AdminSearch({ placeholder }: { placeholder: string }) {
  const [query, setQuery] = useState("");

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      data-search
    />
  );
}

export function BalanceForm({
  businessId,
  dict,
}: {
  businessId: string;
  dict: Dict;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "subtract">("add");
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    adjustBalanceAction,
    {}
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(fd: FormData) {
    startTransition(() => {
      formAction(fd);
    });
  }

  return (
    <div>
      <div className="flex gap-1.5">
        <button
          onClick={() => {
            setMode("add");
            setOpen(true);
          }}
          className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          +{dict.addBalance}
        </button>
        <button
          onClick={() => {
            setMode("subtract");
            setOpen(true);
          }}
          className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink transition hover:bg-surface"
        >
          −{dict.subtractBalance}
        </button>
      </div>

      {open && (
        <form
          action={handleSubmit}
          className="mt-2 rounded-xl border border-line bg-surface/50 p-3"
        >
          <input type="hidden" name="businessId" value={businessId} />
          <input
            type="hidden"
            name="amount"
            value={mode === "add" ? undefined : undefined}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted">
              {mode === "add" ? "+" : "−"}
            </span>
            <input
              type="number"
              name="amount"
              min={1}
              required
              placeholder={dict.balanceAmount}
              className="w-24 rounded-lg border border-line bg-white px-2 py-1.5 text-sm tabular-nums focus:border-brand-500 focus:outline-none"
            />
            <input
              type="text"
              name="note"
              placeholder={dict.balanceNote}
              className="flex-1 rounded-lg border border-line bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {dict.balanceSubmit}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1.5 text-xs text-muted hover:text-ink"
            >
              ✕
            </button>
          </div>
          {state.error && (
            <p className="mt-1 text-xs text-red-600">
              {state.error === "INSUFFICIENT_BALANCE"
                ? dict.insufficientBalance
                : state.error}
            </p>
          )}
          {state.success && (
            <p className="mt-1 text-xs text-green-600">OK</p>
          )}
        </form>
      )}
    </div>
  );
}

export function BlockButton({
  userId,
  isBlocked,
  isSuperadmin,
  dict,
}: {
  userId: string;
  isBlocked: boolean;
  isSuperadmin: boolean;
  dict: Dict;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    toggleBlockUserAction,
    {}
  );
  const [pending, startTransition] = useTransition();

  if (isSuperadmin) return null;

  function handleSubmit(fd: FormData) {
    const msg = isBlocked ? dict.confirmUnblock : dict.confirmBlock;
    if (!confirm(msg)) return;
    startTransition(() => {
      formAction(fd);
    });
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
          isBlocked
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-red-100 text-red-700 hover:bg-red-200"
        }`}
      >
        {isBlocked ? dict.unblock : dict.block}
      </button>
      {state.error && (
        <p className="mt-1 text-xs text-red-600">{state.error}</p>
      )}
    </form>
  );
}
