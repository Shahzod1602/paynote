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
  revalidatePath(`/${locale}/dashboard/templates`);
  revalidatePath(`/${locale}/dashboard/debts`);
}

const boolField = (v: FormDataEntryValue | null) => v === "true" || v === "on" || v === "1";

const templateSchema = z.object({
  type: z.enum(["REMINDER", "OVERDUE", "PAYMENT", "CUSTOM"]),
  name: z.string().trim().min(2).max(80),
  bodyUz: z.string().trim().min(1).max(1000),
  bodyRu: z.string().trim().min(1).max(1000),
  bodyEn: z.string().trim().min(1).max(1000),
  requiresDebt: z.boolean(),
  requiresDay: z.boolean(),
  smsEnabled: z.boolean(),
});

function parse(formData: FormData) {
  return templateSchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    bodyUz: formData.get("bodyUz"),
    bodyRu: formData.get("bodyRu"),
    bodyEn: formData.get("bodyEn"),
    requiresDebt: boolField(formData.get("requiresDebt")),
    requiresDay: boolField(formData.get("requiresDay")),
    smsEnabled: boolField(formData.get("smsEnabled")),
  });
}

export async function createTemplate(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const parsed = parse(formData);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  // Yangi shablon moderatsiyaga tushadi (operator tasdig'ini kutadi).
  await prisma.messageTemplate.create({
    data: { ...parsed.data, status: "PENDING", businessId },
  });

  revalidate(loc(formData.get("locale")));
  return { ok: true };
}

export async function updateTemplate(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const id = String(formData.get("id") || "");
  const existing = await prisma.messageTemplate.findFirst({ where: { id, businessId } });
  if (!existing) return { ok: false, error: "NOT_FOUND" };

  const parsed = parse(formData);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  // Matn o'zgargani uchun qayta moderatsiyaga yuboriladi.
  await prisma.messageTemplate.update({
    where: { id },
    data: { ...parsed.data, status: "PENDING" },
  });

  revalidate(loc(formData.get("locale")));
  return { ok: true };
}

export async function deleteTemplate(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const id = String(formData.get("id") || "");
  const existing = await prisma.messageTemplate.findFirst({ where: { id, businessId } });
  if (!existing) return { ok: false, error: "NOT_FOUND" };

  await prisma.messageTemplate.delete({ where: { id } });
  revalidate(loc(formData.get("locale")));
  return { ok: true };
}
