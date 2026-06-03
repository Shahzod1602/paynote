"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { createCustomer, updateCustomer, deleteCustomer } from "@/lib/actions/customers";
import { formatMoney, type Currency } from "@/lib/format";
import type { CustomerView } from "@/lib/queries";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/lib/utils";

type FormDict = {
  newCustomer: string;
  editCustomer: string;
  name: string;
  phone: string;
  note: string;
  telegramChatId: string;
  telegramHint: string;
  save: string;
  cancel: string;
  edit: string;
  view: string;
  delete: string;
  deleteConfirm: string;
  saving: string;
  error: string;
};

type Props = {
  locale: Locale;
  customers: CustomerView[];
  title: string;
  addLabel: string;
  amountLabel: string;
  emptyLabel: string;
  searchPlaceholder: string;
  noResults: string;
  currency: Currency;
  initialQuery: string;
  form: FormDict;
};

export function CustomersClient({
  locale,
  customers,
  title,
  addLabel,
  amountLabel,
  emptyLabel,
  searchPlaceholder,
  noResults,
  currency,
  initialQuery,
  form,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState(initialQuery);
  const [pending, startTransition] = useTransition();

  const term = q.trim().toLowerCase();
  const filtered = term
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          (c.phone ?? "").toLowerCase().replace(/\s/g, "").includes(term.replace(/\s/g, "")) ||
          c.code.toLowerCase().includes(term)
      )
    : customers;

  function openNew() {
    setEditing(null);
    setError(null);
    setOpen(true);
  }
  function openEdit(c: CustomerView) {
    setEditing(c);
    setError(null);
    setOpen(true);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("locale", locale);
    if (editing) fd.set("id", editing.id);
    startTransition(async () => {
      const res = editing ? await updateCustomer(fd) : await createCustomer(fd);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(form.error);
      }
    });
  }

  function onDelete(c: CustomerView) {
    if (!confirm(form.deleteConfirm)) return;
    const fd = new FormData();
    fd.set("id", c.id);
    fd.set("locale", locale);
    startTransition(async () => {
      await deleteCustomer(fd);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {addLabel}
        </button>
      </div>

      {customers.length > 0 && (
        <div className="relative max-w-md">
          <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-9 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      )}

      {customers.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          {emptyLabel}
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          {noResults}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="group rounded-card border border-line bg-white p-5 shadow-soft transition hover:border-brand-200 hover:shadow-pop">
              <Link href={localePath(locale, `/dashboard/customers/${c.id}`)} className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 text-base font-bold text-brand-700">
                  {c.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink transition group-hover:text-brand-700">{c.name}</p>
                  <p className="text-sm text-muted">{c.phone || "—"}</p>
                </div>
                <span className="rounded-md bg-surface px-2 py-1 font-mono text-[0.7rem] font-semibold tracking-wide text-muted">
                  #{c.code}
                </span>
              </Link>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="text-sm text-muted">{amountLabel}</span>
                <span className={`text-sm font-bold tabular-nums ${c.balance === 0 ? "text-emerald-600" : "text-ink"}`}>
                  {formatMoney(c.balance, currency)}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={localePath(locale, `/dashboard/customers/${c.id}`)}
                  className="flex-1 rounded-lg border border-line px-3 py-1.5 text-center text-xs font-medium text-ink transition hover:border-brand-300 hover:text-brand-700"
                >
                  {form.view}
                </Link>
                <button
                  onClick={() => openEdit(c)}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand-300 hover:text-brand-700"
                >
                  {form.edit}
                </button>
                <button
                  onClick={() => onDelete(c)}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                >
                  {form.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? form.editCustomer : form.newCustomer}>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label={form.name} name="name" defaultValue={editing?.name} required placeholder="Akmal Karimov" />
          <Field label={form.phone} name="phone" type="tel" defaultValue={editing?.phone ?? ""} placeholder="+998 90 123 45 67" />
          <Field label={form.note} name="note" defaultValue={editing?.note ?? ""} placeholder="..." />
          <div>
            <Field
              label={form.telegramChatId}
              name="telegramChatId"
              defaultValue={editing?.telegramChatId ?? ""}
              placeholder="123456789"
            />
            <p className="mt-1 text-xs text-muted">{form.telegramHint}</p>
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
            >
              {form.cancel}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? form.saving : form.save}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
