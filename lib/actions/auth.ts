"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { isLocale, defaultLocale } from "@/i18n/config";

export type AuthState = { error?: string };

function normalizePhone(value: string): string {
  const trimmed = value.replace(/[\s()-]/g, "");
  return trimmed.startsWith("+") ? trimmed : `+${trimmed.replace(/^00/, "")}`;
}

function safeLocale(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return isLocale(v) ? v : defaultLocale;
}

const registerSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  password: z.string().min(6),
});

const loginSchema = z.object({
  phone: z.string().trim().min(7),
  password: z.string().min(1),
});

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "INVALID_INPUT" };
  }

  const phone = normalizePhone(parsed.data.phone);
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return { error: "PHONE_TAKEN" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      phone,
      passwordHash,
      businesses: { create: { name: parsed.data.name, currency: "UZS" } },
    },
  });

  await createSession(user.id);
  redirect(`/${locale}/dashboard`);
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const parsed = loginSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "INVALID_CREDENTIALS" };
  }

  const phone = normalizePhone(parsed.data.phone);
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return { error: "INVALID_CREDENTIALS" };
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { error: "INVALID_CREDENTIALS" };
  }

  await createSession(user.id);
  redirect(`/${locale}/dashboard`);
}

export async function logoutAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get("locale"));
  await destroySession();
  redirect(`/${locale}/login`);
}
