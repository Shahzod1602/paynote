"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveBusinessId } from "@/lib/user";
import { isLocale, defaultLocale } from "@/i18n/config";

export type ActionResult = { ok: boolean; error?: string };

function loc(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return isLocale(v) ? v : defaultLocale;
}

function revalidate(locale: string) {
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/dashboard/customers`);
  revalidatePath(`/${locale}/dashboard/debts`);
}

const customerSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().optional(),
  note: z.string().trim().optional(),
  telegramChatId: z.string().trim().optional(),
});

export async function createCustomer(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    note: formData.get("note") || undefined,
    telegramChatId: formData.get("telegramChatId") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  await prisma.customer.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      note: parsed.data.note || null,
      telegramChatId: parsed.data.telegramChatId || null,
      businessId,
    },
  });

  revalidate(loc(formData.get("locale")));
  return { ok: true };
}

export async function updateCustomer(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const id = String(formData.get("id") || "");
  const existing = await prisma.customer.findFirst({ where: { id, businessId } });
  if (!existing) return { ok: false, error: "NOT_FOUND" };

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    note: formData.get("note") || undefined,
    telegramChatId: formData.get("telegramChatId") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  await prisma.customer.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      note: parsed.data.note || null,
      telegramChatId: parsed.data.telegramChatId || null,
    },
  });

  revalidate(loc(formData.get("locale")));
  return { ok: true };
}

export async function linkTelegram(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const id = String(formData.get("customerId") || "");
  const chatId = String(formData.get("telegramChatId") || "").trim();
  const existing = await prisma.customer.findFirst({ where: { id, businessId } });
  if (!existing) return { ok: false, error: "NOT_FOUND" };

  await prisma.customer.update({
    where: { id },
    data: { telegramChatId: chatId || null },
  });

  revalidate(loc(formData.get("locale")));
  return { ok: true };
}

export async function deleteCustomer(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const id = String(formData.get("id") || "");
  const existing = await prisma.customer.findFirst({ where: { id, businessId } });
  if (!existing) return { ok: false, error: "NOT_FOUND" };

  await prisma.customer.delete({ where: { id } });
  revalidate(loc(formData.get("locale")));
  return { ok: true };
}
