"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import type {
  CustomerProfile,
  CustomerView,
  DashboardStats,
  DebtStatus,
  DebtView,
  GroupedDebtView,
  MessageLogView,
  MonthlyPoint,
  ProductView,
  TemplateOption,
  TemplateView,
} from "@/lib/queries";
import type { Currency } from "@/lib/format";
import { usePrefs, type LocalePref } from "./prefs";
import type { TmaStrings } from "./strings";
import { Avatar, Spinner, StatusBadge } from "./ui";

export type MeInfo = {
  name: string;
  phone: string;
  businessName: string;
  smsBalance: number;
};

export type HomeData = {
  stats: DashboardStats;
  debts: GroupedDebtView[];
  allDebts: DebtView[];
  customers: CustomerView[];
  templates: TemplateOption[];
  templatesAll: TemplateView[];
  products: ProductView[];
  messages: MessageLogView[];
  monthly: MonthlyPoint[];
  me: MeInfo;
};

function statusLabel(s: TmaStrings, status: string): string {
  return status === "PAID" ? s.statusPaid : status === "OVERDUE" ? s.statusOverdue : s.statusPending;
}

// ── icons ───────────────────────────────────────────────────────────────────
export function CashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
export function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div className="tma-field flex items-center gap-2 rounded-xl border px-3.5 py-2.5">
      <span className="tma-hint">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
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
      className="tma-sep grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition active:scale-95"
      style={{ color: danger ? "var(--tg-destructive)" : "var(--tg-button)" }}
    >
      {children}
    </button>
  );
}

function MoneyAmount({ value, className = "" }: { value: number; className?: string }) {
  const { fmt } = usePrefs();
  if (value < 0) {
    return <span className={`whitespace-nowrap text-emerald-600 ${className}`}>+{fmt(-value)}</span>;
  }
  return <span className={`whitespace-nowrap ${className}`}>{fmt(value)}</span>;
}

// ── Home ──────────────────────────────────────────────────────────────────────
// Read-only overview: rows are intentionally not pressable — viewing a customer
// and adding money happen on the Customers tab only.
export function HomeScreen({ s, userName, data }: { s: TmaStrings; userName: string; data: HomeData }) {
  const { fmt } = usePrefs();
  const owing = useMemo(() => data.debts.filter((d) => d.balance > 0), [data.debts]);

  return (
    <div className="space-y-3 px-3 pb-28 pt-3">
      <header className="px-1 pt-1">
        <p className="tma-hint text-sm">{s.hello}</p>
        <h1 className="tma-text text-xl font-extrabold tracking-tight">{userName}</h1>
      </header>

      {/* total outstanding */}
      <div className="tma-card rounded-2xl border p-4">
        <p className="tma-hint text-xs font-medium uppercase tracking-wide">{s.totalOutstanding}</p>
        <p className="tma-text mt-1 text-3xl font-extrabold">{fmt(data.stats.totalOutstanding)}</p>
        <div className="tma-sep mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center">
          <Stat label={s.customersCount} value={String(data.stats.customers)} />
          <Stat label={s.overdue} value={fmt(data.stats.overdue)} accent="rose" />
          <Stat label={s.collectedThisMonth} value={fmt(data.stats.collectedThisMonth)} accent="emerald" />
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="tma-hint px-1 text-sm font-semibold">{s.whoOwes}</h2>
        {owing.length === 0 ? (
          <p className="tma-hint tma-sep rounded-2xl border border-dashed py-10 text-center text-sm">{s.noDebts}</p>
        ) : (
          owing.map((d) => (
            <div key={d.customerId} className="tma-card rounded-2xl border p-3">
              <div className="flex items-center gap-3">
                <Avatar name={d.customerName} />
                <div className="min-w-0 flex-1">
                  <p className="tma-text truncate font-semibold">{d.customerName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={d.status} label={statusLabel(s, d.status)} />
                    {d.debtCount > 1 && (
                      <span className="tma-hint whitespace-nowrap text-xs">
                        {d.debtCount} {s.debtCountSuffix}
                      </span>
                    )}
                  </div>
                </div>
                <MoneyAmount value={d.balance} className="tma-text shrink-0 text-right font-bold" />
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
  onAddDebt,
  searchFocusSignal = 0,
}: {
  s: TmaStrings;
  customers: CustomerView[];
  onOpenCustomer: (id: string) => void;
  onAddDebt: () => void;
  searchFocusSignal?: number;
}) {
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Header search button landed us here — put the cursor in the field.
  useEffect(() => {
    if (searchFocusSignal > 0) searchRef.current?.focus();
  }, [searchFocusSignal]);

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
    <div className="space-y-3 px-3 pb-28 pt-3">
      <h1 className="tma-text px-1 pt-1 text-xl font-extrabold tracking-tight">{s.customersTitle}</h1>
      <SearchBar value={q} onChange={setQ} placeholder={s.search} inputRef={searchRef} />
      <button
        onClick={onAddDebt}
        disabled={customers.length === 0}
        className="tma-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition active:scale-[0.99] disabled:opacity-50"
      >
        <PlusIcon />
        {s.addDebt}
      </button>
      {filtered.length === 0 ? (
        <p className="tma-hint tma-sep rounded-2xl border border-dashed py-10 text-center text-sm">{s.noCustomers}</p>
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

// ── Debts (Qarzlar) ──────────────────────────────────────────────────────────
type DebtFilter = "ALL" | DebtStatus;
const DEBT_FILTERS: DebtFilter[] = ["ALL", "PENDING", "OVERDUE", "PAID"];

export function DebtsScreen({
  s,
  debts,
  onOpenCustomer,
  onPay,
  onRemind,
}: {
  s: TmaStrings;
  debts: DebtView[];
  onOpenCustomer: (id: string) => void;
  onPay: (customerId: string, name: string, balance: number) => void;
  onRemind: (debtId: string, name: string, balance: number) => void;
}) {
  const [filter, setFilter] = useState<DebtFilter>("ALL");
  const filtered = useMemo(
    () => (filter === "ALL" ? debts : debts.filter((d) => d.status === filter)),
    [debts, filter]
  );

  return (
    <div className="space-y-3 px-3 pb-28 pt-3">
      <h1 className="tma-text px-1 pt-1 text-xl font-extrabold tracking-tight">{s.tabDebts}</h1>

      <div className="tma-no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3">
        {DEBT_FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`${active ? "tma-btn" : "tma-card tma-text border"} shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition active:scale-95`}
            >
              {f === "ALL" ? s.filterAll : statusLabel(s, f)}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="tma-hint tma-sep rounded-2xl border border-dashed py-10 text-center text-sm">{s.noDebts}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <div key={d.id} className="tma-card rounded-2xl border p-3">
              <button onClick={() => onOpenCustomer(d.customerId)} className="flex w-full items-center gap-3 text-left">
                <div className="min-w-0 flex-1">
                  <p className="tma-text truncate font-semibold">{d.customerName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={d.status} label={statusLabel(s, d.status)} />
                    <span className="tma-hint whitespace-nowrap text-xs">{formatDate(d.dueDate)}</span>
                  </div>
                </div>
                <MoneyAmount value={d.balance} className="tma-text shrink-0 text-right font-bold" />
              </button>
              {d.balance > 0 && (
                <div className="tma-sep mt-2.5 flex items-center justify-end gap-1.5 border-t pt-2.5">
                  {d.note && <p className="tma-hint mr-auto min-w-0 truncate text-xs">{d.note}</p>}
                  <IconBtn onClick={() => onPay(d.customerId, d.customerName, d.balance)}>
                    <CashIcon />
                  </IconBtn>
                  <IconBtn onClick={() => onRemind(d.id, d.customerName, d.balance)}>
                    <BellIcon />
                  </IconBtn>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Products (Mahsulotlar) ───────────────────────────────────────────────────
export function ProductsScreen({
  s,
  products,
  onAdd,
  onDelete,
}: {
  s: TmaStrings;
  products: ProductView[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3 px-3 pb-28 pt-3">
      <h1 className="tma-text px-1 pt-1 text-xl font-extrabold tracking-tight">{s.tabProducts}</h1>
      <button
        onClick={onAdd}
        className="tma-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition active:scale-[0.99]"
      >
        <PlusIcon />
        {s.addProduct}
      </button>
      {products.length === 0 ? (
        <p className="tma-hint tma-sep rounded-2xl border border-dashed py-10 text-center text-sm">{s.noProducts}</p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="tma-card flex items-center gap-3 rounded-2xl border p-3">
              <div className="min-w-0 flex-1">
                <p className="tma-text truncate font-semibold">{p.name}</p>
                <MoneyAmount value={p.price} className="tma-hint text-xs" />
              </div>
              <IconBtn danger onClick={() => onDelete(p.id)}>
                <TrashIcon />
              </IconBtn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Templates (Shablonlar) ───────────────────────────────────────────────────
const TPL_BADGE: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export function templateTypeLabel(s: TmaStrings, type: string): string {
  return type === "REMINDER"
    ? s.typeReminder
    : type === "OVERDUE"
      ? s.typeOverdue
      : type === "PAYMENT"
        ? s.typePayment
        : s.typeCustom;
}

function templateStatusLabel(s: TmaStrings, status: string): string {
  return status === "APPROVED" ? s.tplApproved : status === "REJECTED" ? s.tplRejected : s.tplPending;
}

export function TemplatesScreen({
  s,
  templates,
  onAdd,
}: {
  s: TmaStrings;
  templates: TemplateView[];
  onAdd: () => void;
}) {
  return (
    <div className="space-y-3 px-3 pb-28 pt-3">
      <h1 className="tma-text px-1 pt-1 text-xl font-extrabold tracking-tight">{s.tabTemplates}</h1>
      <button
        onClick={onAdd}
        className="tma-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition active:scale-[0.99]"
      >
        <PlusIcon />
        {s.addTemplate}
      </button>
      <p className="tma-hint px-1 text-xs">{s.moderationNote}</p>
      {templates.length === 0 ? (
        <p className="tma-hint tma-sep rounded-2xl border border-dashed py-10 text-center text-sm">{s.noTemplates}</p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className="tma-card rounded-2xl border p-3">
              <div className="flex items-center gap-2">
                <p className="tma-text min-w-0 flex-1 truncate font-semibold">{t.name}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TPL_BADGE[t.status] ?? ""}`}>
                  {templateStatusLabel(s, t.status)}
                </span>
              </div>
              <p className="tma-hint mt-0.5 text-xs">{templateTypeLabel(s, t.type)}</p>
              <p className="tma-text mt-1.5 line-clamp-2 text-sm">{t.bodyUz}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SMS log ──────────────────────────────────────────────────────────────────
const MSG_BADGE: Record<string, string> = {
  SENT: "bg-emerald-100 text-emerald-700",
  MOCK: "bg-amber-100 text-amber-700",
  FAILED: "bg-rose-100 text-rose-700",
};

export function SmsScreen({
  s,
  balance,
  messages,
}: {
  s: TmaStrings;
  balance: number;
  messages: MessageLogView[];
}) {
  return (
    <div className="space-y-3 px-3 pb-28 pt-3">
      <h1 className="tma-text px-1 pt-1 text-xl font-extrabold tracking-tight">{s.tabSms}</h1>

      <div className="tma-card flex items-center justify-between rounded-2xl border p-4">
        <p className="tma-hint text-xs font-medium uppercase tracking-wide">{s.smsBalance}</p>
        <p className="text-xl font-extrabold text-emerald-600">{balance} SMS</p>
      </div>

      <section className="space-y-2">
        <h2 className="tma-hint px-1 text-sm font-semibold">{s.messagesTitle}</h2>
        {messages.length === 0 ? (
          <p className="tma-hint tma-sep rounded-2xl border border-dashed py-10 text-center text-sm">{s.noMessages}</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="tma-card rounded-2xl border p-3">
              <div className="flex items-center gap-2">
                <p className="tma-text min-w-0 flex-1 truncate text-sm font-semibold">
                  {m.customerName ?? m.recipient}
                </p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${MSG_BADGE[m.status] ?? ""}`}>
                  {m.status === "SENT" ? s.msgSent : m.status === "MOCK" ? s.msgMock : s.msgFailed}
                </span>
              </div>
              <p className="tma-text mt-1 line-clamp-2 break-words text-sm">{m.text}</p>
              <div className="tma-hint mt-1.5 flex items-center justify-between text-xs">
                <span className="tma-accent font-semibold">{m.channel}</span>
                <span>{formatDate(m.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// ── Reports (Hisobotlar) ─────────────────────────────────────────────────────
export function ReportsScreen({ s, monthly }: { s: TmaStrings; monthly: MonthlyPoint[] }) {
  const { fmt } = usePrefs();
  const max = Math.max(1, ...monthly.flatMap((p) => [p.borrowed, p.paid]));

  function monthLabel(key: string): string {
    const m = Number(key.split("-")[1]);
    return s.monthsShort[m - 1] ?? key;
  }

  return (
    <div className="space-y-3 px-3 pb-28 pt-3">
      <h1 className="tma-text px-1 pt-1 text-xl font-extrabold tracking-tight">{s.tabReports}</h1>

      <div className="tma-hint flex items-center gap-4 px-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--tg-button)" }} />
          {s.borrowed}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          {s.paid}
        </span>
      </div>

      <div className="tma-card space-y-4 rounded-2xl border p-4">
        {monthly.map((p) => (
          <div key={p.key}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="tma-text text-sm font-semibold">{monthLabel(p.key)}</p>
              <p className="tma-hint truncate text-xs">
                {fmt(p.borrowed)} / {fmt(p.paid)}
              </p>
            </div>
            <div className="mt-1.5 space-y-1">
              <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--tg-secondary-bg)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(p.borrowed / max) * 100}%`, background: "var(--tg-button)" }}
                />
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--tg-secondary-bg)" }}>
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${(p.paid / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Profile card (header sheet + settings) ──────────────────────────────────
export function ProfileCard({ s, me }: { s: TmaStrings; me: MeInfo }) {
  return (
    <div className="tma-card overflow-hidden rounded-2xl border">
      <div className="tma-sep flex items-center gap-3 border-b p-4">
        <Avatar name={me.name} />
        <div className="min-w-0">
          <p className="tma-text truncate font-bold">{me.name}</p>
          <p className="tma-hint truncate text-xs">{formatPhone(me.phone)}</p>
        </div>
      </div>
      <div className="space-y-2 p-4 text-sm">
        <p className="tma-hint text-xs uppercase tracking-wide">{s.business}</p>
        <p className="tma-text font-semibold">{me.businessName}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="tma-hint text-xs">{s.smsBalance}</span>
          <span className="font-semibold text-emerald-600">{me.smsBalance} SMS</span>
        </div>
      </div>
    </div>
  );
}

// ── Settings (Sozlamalar) ────────────────────────────────────────────────────
const selectClass =
  "tma-field w-full rounded-xl border px-3.5 py-3 text-base outline-none focus:border-[var(--tg-button)]";

export function SettingsScreen({
  s,
  me,
  onLogout,
  loggingOut,
}: {
  s: TmaStrings;
  me: MeInfo;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const { currency, setCurrency, localePref, setLocalePref } = usePrefs();

  return (
    <div className="space-y-3 px-3 pb-28 pt-3">
      <h1 className="tma-text px-1 pt-1 text-xl font-extrabold tracking-tight">{s.tabSettings}</h1>

      <ProfileCard s={s} me={me} />

      <div className="tma-card space-y-4 rounded-2xl border p-4">
        <label className="block">
          <span className="tma-hint mb-1.5 block text-sm font-medium">{s.language}</span>
          <select
            value={localePref}
            onChange={(e) => setLocalePref(e.target.value as LocalePref)}
            className={selectClass}
          >
            <option value="auto">{s.langAuto}</option>
            <option value="uz">O‘zbekcha</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="block">
          <span className="tma-hint mb-1.5 block text-sm font-medium">{s.currencyLabel}</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className={selectClass}
          >
            <option value="UZS">so‘m</option>
            <option value="USD">USD</option>
          </select>
        </label>
      </div>

      <LogoutButton s={s} onLogout={onLogout} loggingOut={loggingOut} />
    </div>
  );
}

export function LogoutButton({
  s,
  onLogout,
  loggingOut,
}: {
  s: TmaStrings;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  return (
    <button
      onClick={onLogout}
      disabled={loggingOut}
      className="tma-card tma-destructive flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-base font-semibold transition active:scale-[0.99] disabled:opacity-50"
    >
      {loggingOut ? (
        <Spinner className="h-4 w-4" />
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path d="M15 12H4m0 0 4-4m-4 4 4 4M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {s.logout}
    </button>
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
  const { fmt } = usePrefs();

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
    <div className="space-y-3 px-3 pb-28 pt-3">
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
          <Stat label={s.borrowed} value={fmt(profile.totalBorrowed)} />
          <Stat label={s.paid} value={fmt(profile.totalPaid)} accent="emerald" />
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
            <div className="flex items-center justify-between gap-2">
              <MoneyAmount value={d.balance} className="tma-text font-bold" />
              <StatusBadge status={d.status} label={statusLabel(s, d.status)} />
            </div>
            <div className="tma-hint mt-1 flex items-center justify-between gap-2 text-xs">
              <MoneyAmount value={d.amount} />
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
                <span className="tma-accent font-semibold">{m.channel}</span>
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
