"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveBusinessId } from "@/lib/user";
import { isLocale, defaultLocale } from "@/i18n/config";
import type { ActionResult } from "./customers";

function loc(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return isLocale(v) ? v : defaultLocale;
}

function revalidate(locale: string) {
  revalidatePath(`/${locale}/dashboard/products`);
  revalidatePath(`/${locale}/dashboard/debts`);
}

const priceField = z.preprocess(
  (v) => Number(String(v ?? "").replace(/[^\d.]/g, "")),
  z.number().positive()
);

const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  price: priceField,
});

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
  });
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  await prisma.product.create({
    data: { name: parsed.data.name, price: parsed.data.price, businessId },
  });
  revalidate(loc(formData.get("locale")));
  return { ok: true };
}

export async function updateProduct(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const id = String(formData.get("id") || "");
  const existing = await prisma.product.findFirst({ where: { id, businessId } });
  if (!existing) return { ok: false, error: "NOT_FOUND" };

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
  });
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  await prisma.product.update({
    where: { id },
    data: { name: parsed.data.name, price: parsed.data.price },
  });
  revalidate(loc(formData.get("locale")));
  return { ok: true };
}

export async function deleteProduct(formData: FormData): Promise<ActionResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const id = String(formData.get("id") || "");
  const existing = await prisma.product.findFirst({ where: { id, businessId } });
  if (!existing) return { ok: false, error: "NOT_FOUND" };

  await prisma.product.delete({ where: { id } });
  revalidate(loc(formData.get("locale")));
  return { ok: true };
}
