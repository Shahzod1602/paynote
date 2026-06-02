import "server-only";
import { prisma } from "@/lib/prisma";
import { sendTelegram, type SendResult } from "./telegram";
import { sendSms } from "./sms";
import { buildTemplateVars, renderTemplate } from "./template";
import { formatUZS } from "@/lib/format";

export type Channel = "SMS" | "TELEGRAM" | "AUTO";

type Locale = "uz" | "en";

// Suiiste'molga qarshi: bir biznes uchun oynadagi maksimal SMS soni.
const SMS_RATE_MAX = 30;
const SMS_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 soat

export function buildReminderText(opts: {
  name: string;
  balance: number;
  dueDate: string | null;
  locale: Locale;
}): string {
  const amount = formatUZS(opts.balance);
  const due = opts.dueDate ? new Date(opts.dueDate).toLocaleDateString("en-CA") : null;
  if (opts.locale === "en") {
    return (
      `Dear ${opts.name}, you have an outstanding debt of ${amount}` +
      (due ? ` (due ${due})` : "") +
      `. Please settle it at your earliest convenience. — cash.identify.uz`
    );
  }
  return (
    `Hurmatli ${opts.name}, sizda ${amount} miqdorida qarz bor` +
    (due ? ` (muddati: ${due})` : "") +
    `. Iltimos, imkon qadar tezroq to'lab qo'ying. — cash.identify.uz`
  );
}

export type ReminderOutcome =
  | { ok: true; channel: "SMS" | "TELEGRAM"; status: SendResult["status"]; recipient: string }
  | { ok: false; error: string };

/**
 * Sends a reminder for a debt over the chosen channel and records it in MessageLog.
 * channel "AUTO" prefers Telegram (free) and falls back to SMS.
 */
export async function sendReminder(opts: {
  businessId: string;
  debtId: string;
  channel: Channel;
  locale: Locale;
  templateId?: string;
}): Promise<ReminderOutcome> {
  const debt = await prisma.debt.findFirst({
    where: { id: opts.debtId, businessId: opts.businessId },
    include: {
      customer: { include: { debts: { include: { payments: true } } } },
      payments: true,
      business: { include: { user: true } },
    },
  });
  if (!debt) return { ok: false, error: "NOT_FOUND" };

  const paid = debt.payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = Math.max(Number(debt.amount) - paid, 0);

  // Build the message text — from an APPROVED template if chosen, else built-in.
  let text: string | null = null;
  if (opts.templateId) {
    const tpl = await prisma.messageTemplate.findFirst({
      where: { id: opts.templateId, businessId: opts.businessId, status: "APPROVED" },
    });
    if (!tpl) return { ok: false, error: "TEMPLATE_UNAVAILABLE" };

    const clientBalance = debt.customer.debts.reduce((sum, d) => {
      const dPaid = d.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + Math.max(Number(d.amount) - dPaid, 0);
    }, 0);

    const vars = buildTemplateVars({
      clientName: debt.customer.name,
      businessName: debt.business.name,
      businessPhone: debt.business.user.phone,
      clientBalance,
      debtAmount: Number(debt.amount),
      currency: debt.currency,
      dueDate: debt.dueDate,
    });
    const body = opts.locale === "en" ? tpl.bodyEn : tpl.bodyUz;
    text = renderTemplate(body, vars);
  } else {
    text = buildReminderText({
      name: debt.customer.name,
      balance,
      dueDate: debt.dueDate ? debt.dueDate.toISOString() : null,
      locale: opts.locale,
    });
  }

  // Resolve channel.
  let channel: "SMS" | "TELEGRAM";
  if (opts.channel === "AUTO") {
    channel = debt.customer.telegramChatId ? "TELEGRAM" : "SMS";
  } else {
    channel = opts.channel;
  }

  let recipient: string;
  let result: SendResult;
  if (channel === "TELEGRAM") {
    if (!debt.customer.telegramChatId) {
      return { ok: false, error: "NO_TELEGRAM" };
    }
    recipient = debt.customer.telegramChatId;
    result = await sendTelegram(recipient, text);
  } else {
    if (!debt.customer.phone) {
      return { ok: false, error: "NO_PHONE" };
    }
    recipient = debt.customer.phone;

    // Rate limit: oxirgi oynada yuborilgan SMS soni cheklovdan oshmasin.
    const windowStart = new Date(Date.now() - SMS_RATE_WINDOW_MS);
    const recentCount = await prisma.messageLog.count({
      where: {
        businessId: opts.businessId,
        channel: "SMS",
        status: "SENT",
        createdAt: { gte: windowStart },
      },
    });
    if (recentCount >= SMS_RATE_MAX) {
      return { ok: false, error: "RATE_LIMITED" };
    }

    // Balansdan 1 SMS ni atomik rezerv qilamiz (parallel so'rovlardan himoya).
    const reserved = await prisma.business.updateMany({
      where: { id: opts.businessId, smsBalance: { gt: 0 } },
      data: { smsBalance: { decrement: 1 } },
    });
    if (reserved.count === 0) {
      return { ok: false, error: "NO_SMS_BALANCE" };
    }

    result = await sendSms(recipient, text);

    // Haqiqatda yuborilmasa (FAILED/MOCK) rezervni qaytaramiz.
    if (result.status !== "SENT") {
      await prisma.business.update({
        where: { id: opts.businessId },
        data: { smsBalance: { increment: 1 } },
      });
    }
  }

  await prisma.messageLog.create({
    data: {
      channel,
      status: result.status,
      recipient,
      text,
      error: result.error ?? null,
      businessId: opts.businessId,
      customerId: debt.customerId,
      debtId: debt.id,
    },
  });

  return { ok: true, channel, status: result.status, recipient };
}
