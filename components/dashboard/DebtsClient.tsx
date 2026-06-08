"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { createDebt, addCustomerPayment, deleteCustomerDebts } from "@/lib/actions/debts";
import { sendReminderAction } from "@/lib/actions/notify";
import { linkTelegram } from "@/lib/actions/customers";
import { localePath } from "@/lib/utils";
import { formatMoney, formatDate, type Currency } from "@/lib/format";
import type { GroupedDebtView, TemplateOption, ProductView } from "@/lib/queries";
import type { Locale } from "@/i18n/config";

type FormDict = {
  newDebt: string;
  amount: string;
  dueDate: string;
  note: string;
  customer: string;
  selectCustomer: string;
  save: string;
  cancel: string;
  delete: string;
  deleteConfirm: string;
  payment: string;
  paymentAmount: string;
  remaining: string;
  noCustomers: string;
  saving: string;
  error: string;
  reminder: string;
  reminderTitle: string;
  channel: string;
  channelAuto: string;
  channelTelegram: string;
  channelSms: string;
  send: string;
  sending: string;
  sent: string;
  mockSent: string;
  failed: string;
  noPhone: string;
  noTelegram: string;
  noSmsBalance: string;
  rateLimited: string;
  template: string;
  templateDefault: string;
  templateUnavailable: string;
  telegramChatId: string;
  telegramHint: string;
  findContacts: string;
  loadingContacts: string;
  noContacts: string;
  tgNotConfigured: string;
  chatIdSaved: string;
  deleteCustomerConfirm: string;
  debtCount: string;
  overpaid: string;
};

type TgContact = { chatId: string; name: string; username: string | null };

type StatusDict = { paid: string; pending: string; overdue: string };
type TableDict = { customer: string; amount: string; due: string; status: string };

type Props = {
  locale: Locale;
  debts: GroupedDebtView[];
  customers: { id: string; name: string }[];
  templates: TemplateOption[];
  products: ProductView[];
  productSelectLabel: string;
  productNoneLabel: string;
  currency: Currency;
  title: string;
  addLabel: string;
  emptyLabel: string;
  table: TableDict;
  status: StatusDict;
  form: FormDict;
};

const badge: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  OVERDUE: "bg-rose-50 text-rose-700",
};

export function DebtsClient({ locale, debts, customers, templates, products, productSelectLabel, productNoneLabel, currency, title, addLabel, emptyLabel, table, status, form }: Props) {
  const router = useRouter();
  const [debtOpen, setDebtOpen] = useState(false);
  const [debtAmount, setDebtAmount] = useState("");
  const [payDebt, setPayDebt] = useState<GroupedDebtView | null>(null);
  const [reminderDebt, setReminderDebt] = useState<GroupedDebtView | null>(null);
  const [reminderMsg, setReminderMsg] = useState<{ kind: "ok" | "info" | "err"; text: string } | null>(null);
  const [chatId, setChatId] = useState("");
  const [contacts, setContacts] = useState<TgContact[] | null>(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openReminder(d: GroupedDebtView) {
    setReminderMsg(null);
    setContacts(null);
    setChatId(d.customerTelegramChatId ?? "");
    setReminderDebt(d);
  }

  function closeReminder() {
    setReminderDebt(null);
    setReminderMsg(null);
    setContacts(null);
  }

  async function fetchContacts() {
    setContactsLoading(true);
    try {
      const res = await fetch("/api/telegram/contacts", { cache: "no-store" });
      const data = await res.json();
      if (data.configured === false) {
        setReminderMsg({ kind: "err", text: form.tgNotConfigured });
        setContacts([]);
      } else {
        setContacts(data.contacts ?? []);
      }
    } catch {
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }

  function submitReminder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reminderDebt || !reminderDebt.reminderDebtId) return;
    const formEl = new FormData(e.currentTarget);
    const channel = (formEl.get("channel") as string) || "AUTO";
    const templateId = (formEl.get("template") as string) || "";
    const trimmed = chatId.trim();
    setReminderMsg(null);
    startTransition(async () => {
      // Save the chat_id to the customer first (if provided/changed).
      if (trimmed && trimmed !== (reminderDebt.customerTelegramChatId ?? "")) {
        const link = new FormData();
        link.set("customerId", reminderDebt.customerId);
        link.set("telegramChatId", trimmed);
        link.set("locale", locale);
        await linkTelegram(link);
      }

      const fd = new FormData();
      fd.set("locale", locale);
      fd.set("debtId", reminderDebt.reminderDebtId!);
      fd.set("channel", channel);
      if (templateId) fd.set("templateId", templateId);
      const res = await sendReminderAction(fd);
      if (!res.ok) {
        const map: Record<string, string> = {
          NO_PHONE: form.noPhone,
          NO_TELEGRAM: form.noTelegram,
          NO_SMS_BALANCE: form.noSmsBalance,
          RATE_LIMITED: form.rateLimited,
          TEMPLATE_UNAVAILABLE: form.templateUnavailable,
        };
        setReminderMsg({ kind: "err", text: map[res.error] ?? form.failed });
        return;
      }
      if (res.status === "SENT") setReminderMsg({ kind: "ok", text: form.sent });
      else if (res.status === "MOCK") setReminderMsg({ kind: "info", text: form.mockSent });
      else setReminderMsg({ kind: "err", text: form.failed });
      router.refresh();
    });
  }

  const statusLabel: Record<string, string> = {
    PAID: status.paid,
    PENDING: status.pending,
    OVERDUE: status.overdue,
  };

  function submitDebt(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("locale", locale);
    startTransition(async () => {
      const res = await createDebt(fd);
      if (res.ok) {
        setDebtOpen(false);
        router.refresh();
      } else setError(form.error);
    });
  }

  function submitPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!payDebt) return;
    const fd = new FormData(e.currentTarget);
    fd.set("locale", locale);
    fd.set("customerId", payDebt.customerId);
    startTransition(async () => {
      const res = await addCustomerPayment(fd);
      if (res.ok) {
        setPayDebt(null);
        router.refresh();
      } else setError(form.error);
    });
  }

  function onDelete(d: GroupedDebtView) {
    if (!confirm(form.deleteCustomerConfirm)) return;
    const fd = new FormData();
    fd.set("customerId", d.customerId);
    fd.set("locale", locale);
    startTransition(async () => {
      await deleteCustomerDebts(fd);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        <button
          onClick={() => {
            setError(null);
            setDebtAmount("");
            setDebtOpen(true);
          }}
          disabled={customers.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {addLabel}
        </button>
      </div>

      {customers.length === 0 && <p className="text-sm text-muted">{form.noCustomers}</p>}

      {debts.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          {emptyLabel}
        </p>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">{table.customer}</th>
                  <th className="px-5 py-3 font-medium">{table.amount}</th>
                  <th className="px-5 py-3 font-medium">{form.remaining}</th>
                  <th className="px-5 py-3 font-medium">{table.due}</th>
                  <th className="px-5 py-3 font-medium">{table.status}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {debts.map((d) => (
                  <tr key={d.customerId} className="border-t border-line">
                    <td className="px-5 py-3.5">
                      <Link
                        href={localePath(locale, `/dashboard/customers/${d.customerId}`)}
                        className="font-medium text-ink transition hover:text-brand-700 hover:underline"
                      >
                        {d.customerName}
                      </Link>
                      {d.debtCount > 1 && (
                        <p className="text-xs text-muted">{d.debtCount} {form.debtCount}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-ink">{formatMoney(d.amount, currency)}</td>
                    <td className="px-5 py-3.5 font-semibold text-ink">
                      {d.balance < 0 ? (
                        <span className="text-emerald-600">
                          +{formatMoney(-d.balance, currency)}{" "}
                          <span className="text-xs font-normal text-muted">({form.overpaid})</span>
                        </span>
                      ) : (
                        formatMoney(d.balance, currency)
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-muted">{formatDate(d.dueDate)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge[d.status]}`}>
                        {statusLabel[d.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        {d.status !== "PAID" && (
                          <button
                            onClick={() => openReminder(d)}
                            className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition hover:border-brand-300 hover:bg-surface"
                          >
                            {form.reminder}
                          </button>
                        )}
                        {d.status !== "PAID" && (
                          <button
                            onClick={() => {
                              setError(null);
                              setPayDebt(d);
                            }}
                            className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"
                          >
                            {form.payment}
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(d)}
                          className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                        >
                          {form.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New debt modal */}
      <Modal open={debtOpen} onClose={() => setDebtOpen(false)} title={form.newDebt}>
        <form onSubmit={submitDebt} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">{form.customer}</span>
            <select
              name="customerId"
              required
              defaultValue=""
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="" disabled>
                {form.selectCustomer}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {products.length > 0 && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">{productSelectLabel}</span>
              <select
                defaultValue=""
                onChange={(e) => {
                  const p = products.find((x) => x.id === e.target.value);
                  if (p) setDebtAmount(String(p.price));
                }}
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">{productNoneLabel}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatMoney(p.price, currency)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">{form.amount}</span>
            <input
              name="amount"
              type="text"
              inputMode="numeric"
              required
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              placeholder="500000"
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <Input label={form.dueDate} name="dueDate" type="date" min="2000-01-01" max="2100-12-31" />
          <Input label={form.note} name="note" placeholder="..." />
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <Actions pending={pending} onCancel={() => setDebtOpen(false)} cancel={form.cancel} save={form.save} saving={form.saving} />
        </form>
      </Modal>

      {/* Payment modal */}
      <Modal open={!!payDebt} onClose={() => setPayDebt(null)} title={form.payment}>
        {payDebt && (
          <form onSubmit={submitPayment} className="space-y-4">
            <div className="rounded-xl bg-surface px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{payDebt.customerName}</span>
                <span className="font-semibold text-ink">{formatMoney(payDebt.balance, currency)}</span>
              </div>
            </div>
            <Input
              label={form.paymentAmount}
              name="amount"
              type="text"
              inputMode="numeric"
              required
              defaultValue={String(payDebt.balance)}
            />
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <Actions pending={pending} onCancel={() => setPayDebt(null)} cancel={form.cancel} save={form.save} saving={form.saving} />
          </form>
        )}
      </Modal>

      {/* Reminder modal */}
      <Modal open={!!reminderDebt} onClose={closeReminder} title={form.reminderTitle}>
        {reminderDebt && (
          <form onSubmit={submitReminder} className="space-y-4">
            <div className="rounded-xl bg-surface px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{reminderDebt.customerName}</span>
                <span className="font-semibold text-ink">{formatMoney(reminderDebt.balance, currency)}</span>
              </div>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">{form.channel}</span>
              <select
                name="channel"
                defaultValue="AUTO"
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                <option value="AUTO">{form.channelAuto}</option>
                <option value="TELEGRAM">{form.channelTelegram}</option>
                <option value="SMS">{form.channelSms}</option>
              </select>
            </label>

            {templates.length > 0 && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">{form.template}</span>
                <select
                  name="template"
                  defaultValue=""
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">{form.templateDefault}</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{form.telegramChatId}</span>
                <button
                  type="button"
                  onClick={fetchContacts}
                  className="text-xs font-medium text-brand-700 hover:underline"
                >
                  {contactsLoading ? form.loadingContacts : form.findContacts}
                </button>
              </div>
              <input
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="123456789"
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-xs text-muted">{form.telegramHint}</p>

              {contacts !== null && (
                <div className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                  {contacts.length === 0 ? (
                    <p className="text-xs text-muted">{form.noContacts}</p>
                  ) : (
                    contacts.map((c) => (
                      <button
                        key={c.chatId}
                        type="button"
                        onClick={() => setChatId(c.chatId)}
                        className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-xs transition hover:border-brand-300 hover:bg-brand-50"
                      >
                        <span className="font-medium text-ink">
                          {c.name}
                          {c.username && <span className="text-muted"> @{c.username}</span>}
                        </span>
                        <span className="text-muted">{c.chatId}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {reminderMsg && (
              <p
                className={
                  "rounded-lg px-3 py-2 text-sm " +
                  (reminderMsg.kind === "ok"
                    ? "bg-emerald-50 text-emerald-700"
                    : reminderMsg.kind === "info"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-rose-50 text-rose-700")
                }
              >
                {reminderMsg.text}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={closeReminder}
                className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
              >
                {form.cancel}
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-60"
              >
                {pending ? form.sending : form.send}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  placeholder,
  required,
  inputMode,
  defaultValue,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "numeric" | "text";
  defaultValue?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        min={min}
        max={max}
        // Manual entry only — block mouse-wheel from changing numeric fields.
        onWheel={(e) => (e.target as HTMLInputElement).blur()}
        className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}

function Actions({
  pending,
  onCancel,
  cancel,
  save,
  saving,
}: {
  pending: boolean;
  onCancel: () => void;
  cancel: string;
  save: string;
  saving: string;
}) {
  return (
    <div className="flex gap-2 pt-1">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
      >
        {cancel}
      </button>
      <button
        type="submit"
        disabled={pending}
        className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? saving : save}
      </button>
    </div>
  );
}
