"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveBusinessId } from "@/lib/user";
import { isLocale, defaultLocale } from "@/i18n/config";
import { notifyOwnerPaymentReceived } from "@/lib/notify/owner";
import type { ActionResult } from "./customers";

function loc(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return isLocale(v) ? v : defaultLocale;
}

function revalidate(locale: string) {
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/dashboard/customers`);
  revalidatePath(`/${locale}/dashboard/debts`);
}

async function refreshStatus(debtId: string) {
  const debt = await prisma.debt.findUnique({ where: { id: debtId }, include: { payments: true } });
  if (!debt) return;
  const amount = Number(debt.amount);
  const paid = debt.payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = amount - paid;
  let status: "PAID" | "PENDING" | "OVERDUE" = "PENDING";
  if (balance <= 0) status = "PAID";
  else if (debt.dueDate && debt.dueDate.getTime() < Date.now()) status = "OVERDUE";
  await prisma.debt.update({ where: { id: debtId }, data: { status } });
}

// Accepts "500000", "500 000", "500,000" — strips non-digits before parsing.
const amountField = z.preprocess(
  (v) => Number(String(v ?? "").replace(/[^\d.]/g, "")),
  z.number().positive()
);

const debtSchema = z.object({
  customerId: z.string().min(1),
  amount: amountField,
  dueDate: z.string().optional(),
  note: z.string().trim().optional(),
});

export async function createDebt(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const parsed = debtSchema.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const customer = await prisma.customer.findFirst({
    where: { id: parsed.data.customerId, businessId },
  });
  if (!customer) return { ok: false, error: "NOT_FOUND" };

  const due = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
  const debt = await prisma.debt.create({
    data: {
      amount: parsed.data.amount,
      currency: "UZS",
      dueDate: due,
      note: parsed.data.note || null,
      status: due && due.getTime() < Date.now() ? "OVERDUE" : "PENDING",
      customerId: customer.id,
      businessId,
    },
  });
  await refreshStatus(debt.id);

  revalidate(loc(formData.get("locale")));
  return { ok: true };
}

const paymentSchema = z.object({
  debtId: z.string().min(1),
  amount: amountField,
});

export async function addPayment(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const parsed = paymentSchema.safeParse({
    debtId: formData.get("debtId"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const debt = await prisma.debt.findFirst({ where: { id: parsed.data.debtId, businessId } });
  if (!debt) return { ok: false, error: "NOT_FOUND" };

  await prisma.payment.create({
    data: { amount: parsed.data.amount, debtId: debt.id },
  });
  await refreshStatus(debt.id);
  await notifyOwnerPaymentReceived(businessId, debt.customerId, parsed.data.amount);

  revalidate(loc(formData.get("locale")));
  return { ok: true };
}

const customerPaymentSchema = z.object({
  customerId: z.string().min(1),
  amount: amountField,
});

/**
 * Records a payment against a customer's whole balance. The amount is applied
 * to that customer's open debts oldest-first; any leftover (overpayment) is
 * attached to the most recent debt so the money is never lost.
 */
export async function addCustomerPayment(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const parsed = customerPaymentSchema.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const debts = await prisma.debt.findMany({
    where: { customerId: parsed.data.customerId, businessId },
    include: { payments: true },
    orderBy: { createdAt: "asc" },
  });
  if (debts.length === 0) return { ok: false, error: "NOT_FOUND" };

  let remaining = parsed.data.amount;
  for (const debt of debts) {
    if (remaining <= 0) break;
    const open = Number(debt.amount) - debt.payments.reduce((s, p) => s + Number(p.amount), 0);
    if (open <= 0) continue;
    const pay = Math.min(open, remaining);
    await prisma.payment.create({ data: { amount: pay, debtId: debt.id } });
    await refreshStatus(debt.id);
    remaining -= pay;
  }
  if (remaining > 0) {
    const last = debts[debts.length - 1];
    await prisma.payment.create({ data: { amount: remaining, debtId: last.id } });
    await refreshStatus(last.id);
  }
  await notifyOwnerPaymentReceived(businessId, parsed.data.customerId, parsed.data.amount);

  revalidate(loc(formData.get("locale")));
  return { ok: true };
}

/** Deletes every debt (and its payments, via cascade) for one customer. */
export async function deleteCustomerDebts(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const customerId = String(formData.get("customerId") || "");
  if (!customerId) return { ok: false, error: "INVALID_INPUT" };

  await prisma.debt.deleteMany({ where: { customerId, businessId } });
  revalidate(loc(formData.get("locale")));
  return { ok: true };
}

export async function deleteDebt(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const id = String(formData.get("id") || "");
  const debt = await prisma.debt.findFirst({ where: { id, businessId } });
  if (!debt) return { ok: false, error: "NOT_FOUND" };

  await prisma.debt.delete({ where: { id } });
  revalidate(loc(formData.get("locale")));
  return { ok: true };
}
