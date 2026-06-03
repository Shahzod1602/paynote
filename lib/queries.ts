import "server-only";
import { prisma } from "./prisma";

export type DebtStatus = "PAID" | "PENDING" | "OVERDUE";

export type DebtView = {
  id: string;
  customerId: string;
  customerName: string;
  customerTelegramChatId: string | null;
  amount: number;
  paid: number;
  balance: number;
  currency: string;
  dueDate: string | null;
  note: string | null;
  status: DebtStatus;
  createdAt: string;
};

export type CustomerView = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  note: string | null;
  telegramChatId: string | null;
  balance: number;
  debtCount: number;
};

/** Short, human-friendly customer code derived from the cuid. */
export function customerCode(id: string): string {
  return id.slice(-6).toUpperCase();
}

function num(value: unknown): number {
  return typeof value === "object" && value !== null && "toNumber" in value
    ? (value as { toNumber: () => number }).toNumber()
    : Number(value);
}

function computeStatus(balance: number, dueDate: Date | null): DebtStatus {
  if (balance <= 0) return "PAID";
  if (dueDate && dueDate.getTime() < Date.now()) return "OVERDUE";
  return "PENDING";
}

export async function getDebts(businessId: string): Promise<DebtView[]> {
  const debts = await prisma.debt.findMany({
    where: { businessId },
    include: { customer: true, payments: true },
    orderBy: { createdAt: "desc" },
  });

  return debts.map((d) => {
    const amount = num(d.amount);
    const paid = d.payments.reduce((sum, p) => sum + num(p.amount), 0);
    const balance = Math.max(amount - paid, 0);
    return {
      id: d.id,
      customerId: d.customerId,
      customerName: d.customer.name,
      customerTelegramChatId: d.customer.telegramChatId,
      amount,
      paid,
      balance,
      currency: d.currency,
      dueDate: d.dueDate ? d.dueDate.toISOString() : null,
      note: d.note,
      status: computeStatus(balance, d.dueDate),
      createdAt: d.createdAt.toISOString(),
    };
  });
}

export async function getCustomers(businessId: string): Promise<CustomerView[]> {
  const customers = await prisma.customer.findMany({
    where: { businessId },
    include: { debts: { include: { payments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((c) => {
    let balance = 0;
    for (const d of c.debts) {
      const amount = num(d.amount);
      const paid = d.payments.reduce((s, p) => s + num(p.amount), 0);
      balance += Math.max(amount - paid, 0);
    }
    return {
      id: c.id,
      code: customerCode(c.id),
      name: c.name,
      phone: c.phone,
      note: c.note,
      telegramChatId: c.telegramChatId,
      balance,
      debtCount: c.debts.length,
    };
  });
}

export type CustomerProfile = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  note: string | null;
  telegramChatId: string | null;
  balance: number;
  totalBorrowed: number;
  totalPaid: number;
  createdAt: string;
  debts: DebtView[];
  messages: MessageLogView[];
};

/** Full profile for one customer: totals, debts and message history. */
export async function getCustomerProfile(
  businessId: string,
  customerId: string
): Promise<CustomerProfile | null> {
  const c = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
    include: {
      debts: { include: { payments: true }, orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!c) return null;

  let totalBorrowed = 0;
  let totalPaid = 0;
  const debts: DebtView[] = c.debts.map((d) => {
    const amount = num(d.amount);
    const paid = d.payments.reduce((s, p) => s + num(p.amount), 0);
    const balance = Math.max(amount - paid, 0);
    totalBorrowed += amount;
    totalPaid += paid;
    return {
      id: d.id,
      customerId: c.id,
      customerName: c.name,
      customerTelegramChatId: c.telegramChatId,
      amount,
      paid,
      balance,
      currency: d.currency,
      dueDate: d.dueDate ? d.dueDate.toISOString() : null,
      note: d.note,
      status: computeStatus(balance, d.dueDate),
      createdAt: d.createdAt.toISOString(),
    };
  });

  return {
    id: c.id,
    code: customerCode(c.id),
    name: c.name,
    phone: c.phone,
    note: c.note,
    telegramChatId: c.telegramChatId,
    balance: Math.max(totalBorrowed - totalPaid, 0),
    totalBorrowed,
    totalPaid,
    createdAt: c.createdAt.toISOString(),
    debts,
    messages: c.messages.map((m) => ({
      id: m.id,
      channel: m.channel,
      status: m.status,
      recipient: m.recipient,
      text: m.text,
      error: m.error,
      customerName: c.name,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export type DashboardStats = {
  totalOutstanding: number;
  customers: number;
  overdue: number;
  collectedThisMonth: number;
};

export async function getDashboardStats(businessId: string): Promise<DashboardStats> {
  const debts = await getDebts(businessId);
  const customers = await prisma.customer.count({ where: { businessId } });

  const totalOutstanding = debts.reduce((s, d) => s + d.balance, 0);
  const overdue = debts.filter((d) => d.status === "OVERDUE").reduce((s, d) => s + d.balance, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const payments = await prisma.payment.findMany({
    where: { debt: { businessId }, paidAt: { gte: monthStart } },
  });
  const collectedThisMonth = payments.reduce((s, p) => s + num(p.amount), 0);

  return { totalOutstanding, customers, overdue, collectedThisMonth };
}

export async function getRecentDebts(businessId: string, limit = 6): Promise<DebtView[]> {
  const all = await getDebts(businessId);
  return all.slice(0, limit);
}

export type MessageLogView = {
  id: string;
  channel: "SMS" | "TELEGRAM";
  status: "SENT" | "FAILED" | "MOCK";
  recipient: string;
  text: string;
  error: string | null;
  customerName: string | null;
  createdAt: string;
};

export async function getMessageLogs(businessId: string, limit = 100): Promise<MessageLogView[]> {
  const logs = await prisma.messageLog.findMany({
    where: { businessId },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return logs.map((m) => ({
    id: m.id,
    channel: m.channel,
    status: m.status,
    recipient: m.recipient,
    text: m.text,
    error: m.error,
    customerName: m.customer?.name ?? null,
    createdAt: m.createdAt.toISOString(),
  }));
}

/** Returns the business's remaining SMS balance (free quota), or 0. */
export async function getSmsBalance(businessId: string): Promise<number> {
  const b = await prisma.business.findUnique({
    where: { id: businessId },
    select: { smsBalance: true },
  });
  return b?.smsBalance ?? 0;
}

export type MonthlyPoint = { key: string; borrowed: number; paid: number };

function ymKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Monthly borrowed (debts created) vs paid (payments) for the last N months. */
export async function getMonthlyReport(businessId: string, months = 12): Promise<MonthlyPoint[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [debts, payments] = await Promise.all([
    prisma.debt.findMany({
      where: { businessId, createdAt: { gte: start } },
      select: { amount: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { debt: { businessId }, paidAt: { gte: start } },
      select: { amount: true, paidAt: true },
    }),
  ]);

  const buckets = new Map<string, MonthlyPoint>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    buckets.set(ymKey(d), { key: ymKey(d), borrowed: 0, paid: 0 });
  }
  for (const d of debts) {
    const b = buckets.get(ymKey(d.createdAt));
    if (b) b.borrowed += num(d.amount);
  }
  for (const p of payments) {
    const b = buckets.get(ymKey(p.paidAt));
    if (b) b.paid += num(p.amount);
  }
  return [...buckets.values()];
}

export type ProductView = { id: string; name: string; price: number };

export async function getProducts(businessId: string): Promise<ProductView[]> {
  const rows = await prisma.product.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((p) => ({ id: p.id, name: p.name, price: num(p.price) }));
}

export type TemplateType = "REMINDER" | "OVERDUE" | "PAYMENT" | "CUSTOM";
export type TemplateStatus = "PENDING" | "APPROVED" | "REJECTED";

export type TemplateView = {
  id: string;
  type: TemplateType;
  name: string;
  bodyUz: string;
  bodyRu: string;
  bodyEn: string;
  requiresDebt: boolean;
  requiresDay: boolean;
  smsEnabled: boolean;
  status: TemplateStatus;
  createdAt: string;
};

export async function getTemplates(businessId: string): Promise<TemplateView[]> {
  const rows = await prisma.messageTemplate.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((t) => ({
    id: t.id,
    type: t.type,
    name: t.name,
    bodyUz: t.bodyUz,
    bodyRu: t.bodyRu,
    bodyEn: t.bodyEn,
    requiresDebt: t.requiresDebt,
    requiresDay: t.requiresDay,
    smsEnabled: t.smsEnabled,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));
}

export type TemplateOption = { id: string; name: string; type: TemplateType };

/** Approved templates only — used to populate the reminder picker. */
export async function getApprovedTemplates(businessId: string): Promise<TemplateOption[]> {
  const rows = await prisma.messageTemplate.findMany({
    where: { businessId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, type: true },
  });
  return rows;
}
