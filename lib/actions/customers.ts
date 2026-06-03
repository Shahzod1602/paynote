"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveBusinessId } from "@/lib/user";
import { isLocale, defaultLocale } from "@/i18n/config";
import { normalizePhone } from "@/lib/phone";

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
  note: z.string().trim().optional(),
  telegramChatId: z.string().trim().optional(),
});

type Validated = {
  name: string;
  phone: string;
  note: string | null;
  telegramChatId: string | null;
};

/** Validates name (required), phone (required + format) and dedupes by phone. */
async function validateCustomer(
  formData: FormData,
  businessId: string,
  selfId?: string
): Promise<{ ok: true; data: Validated } | { ok: false; error: string }> {
  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    note: formData.get("note") || undefined,
    telegramChatId: formData.get("telegramChatId") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "NAME_REQUIRED" };

  const rawPhone = String(formData.get("phone") || "").trim();
  if (!rawPhone) return { ok: false, error: "PHONE_REQUIRED" };
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "INVALID_PHONE" };

  // No two customers with the same phone in one business.
  const dup = await prisma.customer.findFirst({
    where: { businessId, phone, ...(selfId ? { id: { not: selfId } } : {}) },
    select: { id: true },
  });
  if (dup) return { ok: false, error: "DUPLICATE_PHONE" };

  return {
    ok: true,
    data: {
      name: parsed.data.name,
      phone,
      note: parsed.data.note || null,
      telegramChatId: parsed.data.telegramChatId || null,
    },
  };
}

export async function createCustomer(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const v = await validateCustomer(formData, businessId);
  if (!v.ok) return { ok: false, error: v.error };

  await prisma.customer.create({ data: { ...v.data, businessId } });

  revalidate(loc(formData.get("locale")));
  return { ok: true };
}

export async function updateCustomer(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const id = String(formData.get("id") || "");
  const existing = await prisma.customer.findFirst({ where: { id, businessId } });
  if (!existing) return { ok: false, error: "NOT_FOUND" };

  const v = await validateCustomer(formData, businessId, id);
  if (!v.ok) return { ok: false, error: v.error };

  await prisma.customer.update({ where: { id }, data: v.data });

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

export type ImportRow = { name: string; phone: string };
export type ImportResult = {
  ok: boolean;
  added: number;
  skipped: number;
  failed: number;
  error?: string;
};

/** Bulk-imports customers from parsed CSV rows. Skips duplicates and invalid phones. */
export async function importCustomers(rows: ImportRow[], locale: string): Promise<ImportResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, added: 0, skipped: 0, failed: 0, error: "UNAUTHORIZED" };
  if (!Array.isArray(rows)) return { ok: false, added: 0, skipped: 0, failed: 0, error: "INVALID_INPUT" };

  const existing = await prisma.customer.findMany({ where: { businessId }, select: { phone: true } });
  const seen = new Set(existing.map((e) => e.phone).filter(Boolean) as string[]);

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of rows.slice(0, 5000)) {
    const name = String(r?.name ?? "").trim();
    const phone = normalizePhone(String(r?.phone ?? ""));
    if (name.length < 2 || !phone) {
      failed++;
      continue;
    }
    if (seen.has(phone)) {
      skipped++;
      continue;
    }
    seen.add(phone);
    try {
      await prisma.customer.create({ data: { name, phone, businessId } });
      added++;
    } catch {
      failed++;
    }
  }

  revalidate(isLocale(locale) ? locale : defaultLocale);
  return { ok: true, added, skipped, failed };
}
