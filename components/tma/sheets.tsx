"use client";

import { useState } from "react";
import { createDebt, addCustomerPayment } from "@/lib/actions/debts";
import { sendReminderAction } from "@/lib/actions/notify";
import { formatMoney } from "@/lib/format";
import type { CustomerView, TemplateOption } from "@/lib/queries";
import type { TmaLocale, TmaStrings } from "./strings";
import { Sheet, Field, PrimaryButton } from "./ui";
import { useTelegram } from "./useTelegram";

const selectClass =
  "tma-field w-full rounded-xl border px-3.5 py-3 text-base outline-none focus:border-[var(--tg-button)]";

function Summary({ name, balance }: { name: string; balance: number }) {
  return (
    <div className="tma-sep mb-1 flex items-center justify-between rounded-xl border px-4 py-3 text-sm" style={{ background: "var(--tg-secondary-bg)" }}>
      <span className="tma-hint">{name}</span>
      <span className="tma-text font-semibold">{formatMoney(Math.max(balance, 0))}</span>
    </div>
  );
}

export function AddDebtSheet({
  open,
  onClose,
  onDone,
  locale,
  s,
  customers,
  presetCustomerId,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  locale: TmaLocale;
  s: TmaStrings;
  customers: CustomerView[];
  presetCustomerId?: string;
}) {
  const { haptic } = useTelegram();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("locale", locale);
    if (presetCustomerId) fd.set("customerId", presetCustomerId);
    setBusy(true);
    setErr(null);
    void (async () => {
      const res = await createDebt(fd);
      setBusy(false);
      if (res.ok) {
        haptic("success");
        onDone();
        onClose();
      } else {
        haptic("error");
        setErr(s.errorSave);
      }
    })();
  }

  return (
    <Sheet open={open} onClose={onClose} title={s.newDebt}>
      <form onSubmit={submit} className="space-y-4">
        {!presetCustomerId && (
          <label className="block">
            <span className="tma-hint mb-1.5 block text-sm font-medium">{s.customer}</span>
            <select name="customerId" required defaultValue="" className={selectClass}>
              <option value="" disabled>
                {s.selectCustomer}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <Field label={s.amount} name="amount" type="text" inputMode="numeric" required placeholder="500000" />
        <Field label={s.dueDate} name="dueDate" type="date" />
        <Field label={s.note} name="note" placeholder="…" />
        {err && <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700">{err}</p>}
        <PrimaryButton type="submit" loading={busy}>
          {busy ? s.saving : s.save}
        </PrimaryButton>
      </form>
    </Sheet>
  );
}

export function PaymentSheet({
  open,
  onClose,
  onDone,
  locale,
  s,
  customerId,
  name,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  locale: TmaLocale;
  s: TmaStrings;
  customerId: string;
  name: string;
  balance: number;
}) {
  const { haptic } = useTelegram();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("locale", locale);
    fd.set("customerId", customerId);
    setBusy(true);
    setErr(null);
    void (async () => {
      const res = await addCustomerPayment(fd);
      setBusy(false);
      if (res.ok) {
        haptic("success");
        onDone();
        onClose();
      } else {
        haptic("error");
        setErr(s.errorSave);
      }
    })();
  }

  return (
    <Sheet open={open} onClose={onClose} title={s.payment}>
      <form onSubmit={submit} className="space-y-4">
        <Summary name={name} balance={balance} />
        <Field
          label={s.paymentAmount}
          name="amount"
          type="text"
          inputMode="numeric"
          required
          defaultValue={String(Math.max(balance, 0))}
        />
        {err && <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700">{err}</p>}
        <PrimaryButton type="submit" loading={busy}>
          {busy ? s.saving : s.save}
        </PrimaryButton>
      </form>
    </Sheet>
  );
}

export function ReminderSheet({
  open,
  onClose,
  onDone,
  locale,
  s,
  debtId,
  name,
  balance,
  templates,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  locale: TmaLocale;
  s: TmaStrings;
  debtId: string;
  name: string;
  balance: number;
  templates: TemplateOption[];
}) {
  const { haptic } = useTelegram();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "info" | "err"; text: string } | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("locale", locale);
    fd.set("debtId", debtId);
    setBusy(true);
    setMsg(null);
    void (async () => {
      const res = await sendReminderAction(fd);
      setBusy(false);
      if (!res.ok) {
        const map: Record<string, string> = {
          NO_PHONE: s.noPhone,
          NO_TELEGRAM: s.noTelegram,
          NO_SMS_BALANCE: s.noSmsBalance,
          RATE_LIMITED: s.rateLimited,
          TEMPLATE_UNAVAILABLE: s.templateUnavailable,
        };
        haptic("error");
        setMsg({ kind: "err", text: map[res.error] ?? s.failed });
        return;
      }
      if (res.status === "SENT") {
        haptic("success");
        setMsg({ kind: "ok", text: `${s.sent} (${res.channel})` });
      } else if (res.status === "MOCK") {
        setMsg({ kind: "info", text: s.mockSent });
      } else {
        setMsg({ kind: "err", text: s.failed });
      }
      onDone();
    })();
  }

  return (
    <Sheet open={open} onClose={onClose} title={s.reminderTitle}>
      <form onSubmit={submit} className="space-y-4">
        <Summary name={name} balance={balance} />
        <label className="block">
          <span className="tma-hint mb-1.5 block text-sm font-medium">{s.channel}</span>
          <select name="channel" defaultValue="AUTO" className={selectClass}>
            <option value="AUTO">{s.channelAuto}</option>
            <option value="TELEGRAM">{s.channelTelegram}</option>
            <option value="SMS">{s.channelSms}</option>
          </select>
        </label>
        {templates.length > 0 && (
          <label className="block">
            <span className="tma-hint mb-1.5 block text-sm font-medium">{s.template}</span>
            <select name="templateId" defaultValue="" className={selectClass}>
              <option value="">{s.templateDefault}</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {msg && (
          <p
            className={
              "rounded-xl px-3 py-2 text-sm " +
              (msg.kind === "ok"
                ? "bg-emerald-100 text-emerald-700"
                : msg.kind === "info"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700")
            }
          >
            {msg.text}
          </p>
        )}
        <PrimaryButton type="submit" loading={busy}>
          {busy ? s.sending : s.send}
        </PrimaryButton>
      </form>
    </Sheet>
  );
}
