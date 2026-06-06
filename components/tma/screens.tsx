"use client";

import { useMemo, useState } from "react";
import { formatMoney, formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import type {
  CustomerProfile,
  CustomerView,
  DashboardStats,
  GroupedDebtView,
  TemplateOption,
} from "@/lib/queries";
import type { TmaStrings } from "./strings";
import { Avatar, Spinner, StatusBadge } from "./ui";

export type HomeData = {
  stats: DashboardStats;
  debts: GroupedDebtView[];
  customers: CustomerView[];
  templates: TemplateOption[];
};

function statusLabel(s: TmaStrings, status: string): string {
  return status === "PAID" ? s.statusPaid : status === "OVERDUE" ? s.statusOverdue : s.statusPending;
}

// ── icons ───────────────────────────────────────────────────────────────────
function CashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="tma-field flex items-center gap-2 rounded-xl border px-3.5 py-2.5">
      <span className="tma-hint">
        <SearchIcon />
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-base outline-none"
      />
    </div>
  );
}

function IconBtn({ onClick, children, danger }: { onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="tma-sep grid h-9 w-9 place-items-center rounded-xl border transition active:scale-95"
      style={{ color: danger ? "var(--tg-destructive)" : "var(--tg-button)" }}
    >
      {children}
    </button>
  );
}

function MoneyAmount({ value, className = "" }: { value: number; className?: string }) {
  if (value < 0) {
    return <span className={`text-emerald-600 ${className}`}>+{formatMoney(-value)}</span>;
  }
  return <span className={className}>{formatMoney(value)}</span>;
}

// ── Home ──────────────────────────────────────────────────────────────────────
export function HomeScreen({
  s,
  userName,
  data,
  onOpenCustomer,
  onAddDebt,
  onPay,
  onRemind,
}: {
  s: TmaStrings;
  userName: string;
  data: HomeData;
  onOpenCustomer: (id: string) => void;
  onAddDebt: () => void;
  onPay: (customerId: string, name: string, balance: number) => void;
  onRemind: (debtId: string, name: string, balance: number) => void;
}) {
  const [q, setQ] = useState("");
  const owing = useMemo(() => data.debts.filter((d) => d.balance > 0), [data.debts]);
  const filtered = useMemo(
    () => (q.trim() ? owing.filter((d) => d.customerName.toLowerCase().includes(q.trim().toLowerCase())) : owing),
    [owing, q]
  );

  return (
    <div className="space-y-4 px-4 pb-28 pt-4">
      <header className="pt-1">
        <p className="tma-hint text-sm">{s.hello}</p>
        <h1 className="tma-text text-xl font-extrabold tracking-tight">{userName}</h1>
      </header>

      {/* total outstanding */}
      <div className="tma-card rounded-2xl border p-4">
        <p className="tma-hint text-xs font-medium uppercase tracking-wide">{s.totalOutstanding}</p>
        <p className="tma-text mt-1 text-3xl font-extrabold">{formatMoney(data.stats.totalOutstanding)}</p>
        <div className="tma-sep mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center">
          <Stat label={s.customersCount} value={String(data.stats.customers)} />
          <Stat label={s.overdue} value={formatMoney(data.stats.overdue)} accent="rose" />
          <Stat label={s.collectedThisMonth} value={formatMoney(data.stats.collectedThisMonth)} accent="emerald" />
        </div>
      </div>

      <button
        onClick={onAddDebt}
        disabled={data.customers.length === 0}
        className="tma-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition active:scale-[0.99] disabled:opacity-50"
      >
        <PlusIcon />
        {s.addDebt}
      </button>

      <SearchBar value={q} onChange={setQ} placeholder={s.search} />

      <section className="space-y-2">
        <h2 className="tma-hint px-1 text-sm font-semibold">{s.whoOwes}</h2>
        {filtered.length === 0 ? (
          <p className="tma-hint rounded-2xl border border-dashed py-10 text-center text-sm tma-sep">{s.noDebts}</p>
        ) : (
          filtered.map((d) => (
            <div key={d.customerId} className="tma-card flex items-center gap-2.5 rounded-2xl border p-3">
              <button onClick={() => onOpenCustomer(d.customerId)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <Avatar name={d.customerName} />
                <div className="min-w-0 flex-1">
                  <p className="tma-text truncate font-semibold">{d.customerName}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <StatusBadge status={d.status} label={statusLabel(s, d.status)} />
                    {d.debtCount > 1 && (
                      <span className="tma-hint text-xs">
                        {d.debtCount} {s.debtCountSuffix}
                      </span>
                    )}
                  </div>
                </div>
                <MoneyAmount value={d.balance} className="tma-text shrink-0 font-bold" />
              </button>
              <div className="flex shrink-0 flex-col gap-1.5">
                <IconBtn onClick={() => onPay(d.customerId, d.customerName, d.balance)}>
                  <CashIcon />
                </IconBtn>
                {d.reminderDebtId && (
                  <IconBtn onClick={() => onRemind(d.reminderDebtId!, d.customerName, d.balance)}>
                    <BellIcon />
                  </IconBtn>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "rose" | "emerald" }) {
  const color = accent === "rose" ? "text-rose-600" : accent === "emerald" ? "text-emerald-600" : "";
  return (
    <div>
      <p className={`text-sm font-bold ${color || "tma-text"}`}>{value}</p>
      <p className="tma-hint mt-0.5 text-[11px] leading-tight">{label}</p>
    </div>
  );
}

// ── Customers ─────────────────────────────────────────────────────────────────
export function CustomersScreen({
  s,
  customers,
  onOpenCustomer,
}: {
  s: TmaStrings;
  customers: CustomerView[];
  onOpenCustomer: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      q.trim()
        ? customers.filter(
            (c) =>
              c.name.toLowerCase().includes(q.trim().toLowerCase()) ||
              (c.phone ?? "").includes(q.trim())
          )
        : customers,
    [customers, q]
  );

  return (
    <div className="space-y-3 px-4 pb-28 pt-4">
      <h1 className="tma-text px-1 pt-1 text-xl font-extrabold tracking-tight">{s.customersTitle}</h1>
      <SearchBar value={q} onChange={setQ} placeholder={s.search} />
      {filtered.length === 0 ? (
        <p className="tma-hint rounded-2xl border border-dashed py-10 text-center text-sm tma-sep">{s.noCustomers}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => onOpenCustomer(c.id)}
              className="tma-card flex w-full items-center gap-3 rounded-2xl border p-3 text-left"
            >
              <Avatar name={c.name} />
              <div className="min-w-0 flex-1">
                <p className="tma-text truncate font-semibold">{c.name}</p>
                <p className="tma-hint truncate text-xs">{c.phone ? formatPhone(c.phone) : s.noPhoneShort}</p>
              </div>
              {c.balance !== 0 && <MoneyAmount value={c.balance} className="tma-text shrink-0 font-bold" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Customer detail ───────────────────────────────────────────────────────────
export function CustomerScreen({
  s,
  profile,
  loading,
  onAddDebt,
  onPay,
  onRemind,
}: {
  s: TmaStrings;
  profile: CustomerProfile | null;
  loading: boolean;
  onAddDebt: (customerId: string) => void;
  onPay: (customerId: string, name: string, balance: number) => void;
  onRemind: (debtId: string, name: string, balance: number) => void;
}) {
  if (loading || !profile) {
    return (
      <div className="tma-app flex min-h-[60vh] items-center justify-center">
        <Spinner className="tma-accent h-7 w-7" />
      </div>
    );
  }

  const openDebts = profile.debts.filter((d) => d.balance > 0);
  // debts are newest-first → the last open one is the oldest (reminder target).
  const reminderDebtId = openDebts.length ? openDebts[openDebts.length - 1].id : null;

  return (
    <div className="space-y-4 px-4 pb-28 pt-4">
      <div className="tma-card rounded-2xl border p-4">
        <div className="flex items-center gap-3">
          <Avatar name={profile.name} />
          <div className="min-w-0">
            <p className="tma-text truncate text-lg font-bold">{profile.name}</p>
            {profile.phone && <p className="tma-hint text-sm">{formatPhone(profile.phone)}</p>}
          </div>
        </div>
        <div className="mt-4">
          <p className="tma-hint text-xs font-medium uppercase tracking-wide">{s.balance}</p>
          <MoneyAmount value={profile.balance} className="tma-text text-2xl font-extrabold" />
        </div>
        <div className="tma-sep mt-3 grid grid-cols-2 gap-2 border-t pt-3">
          <Stat label={s.borrowed} value={formatMoney(profile.totalBorrowed)} />
          <Stat label={s.paid} value={formatMoney(profile.totalPaid)} accent="emerald" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ActionPill onClick={() => onAddDebt(profile.id)} label={s.addDebt}>
          <PlusIcon />
        </ActionPill>
        <ActionPill onClick={() => onPay(profile.id, profile.name, profile.balance)} label={s.payment} disabled={profile.balance <= 0}>
          <CashIcon />
        </ActionPill>
        <ActionPill
          onClick={() => reminderDebtId && onRemind(reminderDebtId, profile.name, profile.balance)}
          label={s.reminder}
          disabled={!reminderDebtId}
        >
          <BellIcon />
        </ActionPill>
      </div>

      <section className="space-y-2">
        <h2 className="tma-hint px-1 text-sm font-semibold">{s.debtsTitle}</h2>
        {profile.debts.map((d) => (
          <div key={d.id} className="tma-card rounded-2xl border p-3">
            <div className="flex items-center justify-between">
              <MoneyAmount value={d.balance} className="tma-text font-bold" />
              <StatusBadge status={d.status} label={statusLabel(s, d.status)} />
            </div>
            <div className="tma-hint mt-1 flex items-center justify-between text-xs">
              <span>{formatMoney(d.amount)}</span>
              <span>{formatDate(d.dueDate)}</span>
            </div>
            {d.note && <p className="tma-hint mt-1 text-xs">{d.note}</p>}
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="tma-hint px-1 text-sm font-semibold">{s.messagesTitle}</h2>
        {profile.messages.length === 0 ? (
          <p className="tma-hint px-1 text-xs">{s.noMessages}</p>
        ) : (
          profile.messages.map((m) => (
            <div key={m.id} className="tma-card rounded-2xl border p-3">
              <div className="tma-hint flex items-center justify-between text-xs">
                <span className="font-semibold tma-accent">{m.channel}</span>
                <span>{formatDate(m.createdAt)}</span>
              </div>
              <p className="tma-text mt-1 text-sm">{m.text}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function ActionPill({
  onClick,
  label,
  children,
  disabled,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="tma-card flex flex-col items-center gap-1 rounded-2xl border py-3 text-xs font-medium transition active:scale-95 disabled:opacity-40"
      style={{ color: "var(--tg-button)" }}
    >
      {children}
      <span className="tma-text">{label}</span>
    </button>
  );
}
