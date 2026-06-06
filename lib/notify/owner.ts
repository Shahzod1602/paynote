import "server-only";
import { prisma } from "@/lib/prisma";
import { sendTelegram } from "./telegram";
import { formatUZS } from "@/lib/format";
import { getDashboardStats, getDebtsGrouped } from "@/lib/queries";

/** The owner's Telegram chat id (== their linked user id), or null. */
async function ownerChatId(businessId: string): Promise<string | null> {
  const b = await prisma.business.findUnique({
    where: { id: businessId },
    select: { user: { select: { telegramUserId: true } } },
  });
  return b?.user.telegramUserId ?? null;
}

/**
 * DMs the business owner that a payment arrived. Self-contained and never throws
 * — a notification failure must never break the payment action that triggered it.
 */
export async function notifyOwnerPaymentReceived(
  businessId: string,
  customerId: string,
  amount: number
): Promise<void> {
  try {
    const [chatId, customer] = await Promise.all([
      ownerChatId(businessId),
      prisma.customer.findUnique({ where: { id: customerId }, select: { name: true } }),
    ]);
    if (!chatId) return;
    const text = `💵 <b>To'lov qabul qilindi</b>\n${customer?.name ?? "Mijoz"}: <b>${formatUZS(amount)}</b>`;
    await sendTelegram(chatId, text);
  } catch {
    // sukut — bildirishnoma asosiy amalni yiqitmaydi
  }
}

/** Builds the owner's daily digest, or null if there is nothing outstanding. */
export async function buildDailySummary(businessId: string): Promise<string | null> {
  const [stats, grouped] = await Promise.all([
    getDashboardStats(businessId),
    getDebtsGrouped(businessId),
  ]);
  const owing = grouped.filter((g) => g.balance > 0);
  if (owing.length === 0) return null;

  const top = [...owing].sort((a, b) => b.balance - a.balance).slice(0, 10);
  const lines = top.map((g, i) => `${i + 1}. ${g.customerName} — ${formatUZS(g.balance)}`);
  const overdueCount = grouped.filter((g) => g.status === "OVERDUE").length;

  return (
    `📊 <b>Kunlik hisobot — Paynote</b>\n\n` +
    `Jami qarz: <b>${formatUZS(stats.totalOutstanding)}</b>\n` +
    `Qarzdorlar: <b>${owing.length}</b>` +
    (overdueCount ? ` · Muddati o'tgan: <b>${overdueCount}</b>` : "") +
    `\n\n${lines.join("\n")}`
  );
}

export type SummaryStatus = "sent" | "skip" | "mock" | "fail";

/** Sends the daily summary to one business owner. */
export async function sendOwnerDailySummary(businessId: string): Promise<SummaryStatus> {
  const chatId = await ownerChatId(businessId);
  if (!chatId) return "skip";
  const text = await buildDailySummary(businessId);
  if (!text) return "skip";
  const r = await sendTelegram(chatId, text);
  return r.status === "SENT" ? "sent" : r.status === "MOCK" ? "mock" : "fail";
}
