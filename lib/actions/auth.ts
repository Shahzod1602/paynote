"use server";

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { VerificationPurpose } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { isLocale, defaultLocale } from "@/i18n/config";
import { normalizePhone as normalizeUzPhone } from "@/lib/phone";
import { sendSms } from "@/lib/notify/sms";

export type AuthState = { error?: string; sent?: boolean };

const CODE_TTL_MS = 10 * 60 * 1000; // kod 10 daqiqa amal qiladi
const RESEND_COOLDOWN_MS = 60 * 1000; // qayta yuborish: 60 soniya
const MAX_ATTEMPTS = 5;

// Login eski (chet el raqamlari bo'lishi mumkin bo'lgan) hisoblar bilan ham ishlashi uchun yumshoq normalizatsiya.
function lenientPhone(value: string): string {
  const trimmed = value.replace(/[\s()-]/g, "");
  return trimmed.startsWith("+") ? trimmed : `+${trimmed.replace(/^00/, "")}`;
}

function safeLocale(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return isLocale(v) ? v : defaultLocale;
}

function smsCodeText(code: string, locale: string): string {
  return locale === "en"
    ? `Paynote verification code: ${code}. Valid for 10 minutes. Do not share it.`
    : `Paynote tasdiqlash kodi: ${code}. 10 daqiqa amal qiladi. Hech kimga bermang.`;
}

/** 6 xonali kod yaratadi, hashlab saqlaydi va SMS yuboradi. */
async function issueCode(
  phone: string,
  purpose: VerificationPurpose,
  locale: string
): Promise<AuthState> {
  const existing = await prisma.phoneVerification.findUnique({
    where: { phone_purpose: { phone, purpose } },
  });
  if (existing && Date.now() - existing.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return { error: "RESEND_TOO_SOON" };
  }

  const code = String(randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await prisma.phoneVerification.upsert({
    where: { phone_purpose: { phone, purpose } },
    create: { phone, purpose, codeHash, expiresAt },
    update: { codeHash, expiresAt, attempts: 0, createdAt: new Date() },
  });

  const result = await sendSms(phone, smsCodeText(code, locale));
  if (result.status === "FAILED") {
    return { error: "SMS_FAILED" };
  }
  return { sent: true };
}

/** Kodni tekshiradi; noto'g'ri bo'lsa urinishlar sonini oshiradi. */
async function checkCode(
  phone: string,
  purpose: VerificationPurpose,
  code: string
): Promise<string | null> {
  const record = await prisma.phoneVerification.findUnique({
    where: { phone_purpose: { phone, purpose } },
  });
  if (!record) return "CODE_INVALID";
  if (record.expiresAt.getTime() < Date.now()) return "CODE_EXPIRED";
  if (record.attempts >= MAX_ATTEMPTS) return "TOO_MANY_ATTEMPTS";

  const ok = await bcrypt.compare(code, record.codeHash);
  if (!ok) {
    await prisma.phoneVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return record.attempts + 1 >= MAX_ATTEMPTS ? "TOO_MANY_ATTEMPTS" : "CODE_INVALID";
  }
  return null;
}

const startRegisterSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(7),
});

const completeRegisterSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  code: z.string().trim().length(6),
  password: z.string().min(6),
  confirmPassword: z.string(),
});

const loginSchema = z.object({
  phone: z.string().trim().min(7),
  password: z.string().min(1),
});

/** 1-bosqich: ism + telefon → SMS orqali tasdiqlash kodi yuboriladi. */
export async function startRegisterAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const parsed = startRegisterSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: "INVALID_INPUT" };

  const phone = normalizeUzPhone(parsed.data.phone);
  if (!phone) return { error: "INVALID_PHONE" };

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return { error: "PHONE_TAKEN" };

  return issueCode(phone, VerificationPurpose.REGISTER, locale);
}

/** 2-bosqich: SMS kod + foydalanuvchi o'zi tanlagan parol → hisob yaratiladi. */
export async function completeRegisterAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const parsed = completeRegisterSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    code: formData.get("code"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: "INVALID_INPUT" };
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: "PASSWORD_MISMATCH" };
  }

  const phone = normalizeUzPhone(parsed.data.phone);
  if (!phone) return { error: "INVALID_PHONE" };

  const codeError = await checkCode(phone, VerificationPurpose.REGISTER, parsed.data.code);
  if (codeError) return { error: codeError };

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return { error: "PHONE_TAKEN" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      phone,
      passwordHash,
      businesses: { create: { name: parsed.data.name, currency: "UZS" } },
    },
  });
  await prisma.phoneVerification.deleteMany({
    where: { phone, purpose: VerificationPurpose.REGISTER },
  });

  await createSession(user.id);
  redirect(`/${locale}/dashboard`);
}

/** Parolni tiklash, 1-bosqich: telefon → SMS kod. */
export async function startResetAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const raw = formData.get("phone");
  const phone = normalizeUzPhone(typeof raw === "string" ? raw : "");
  if (!phone) return { error: "INVALID_PHONE" };

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return { error: "PHONE_NOT_FOUND" };

  return issueCode(phone, VerificationPurpose.RESET, locale);
}

const completeResetSchema = z.object({
  phone: z.string().trim().min(7),
  code: z.string().trim().length(6),
  password: z.string().min(6),
  confirmPassword: z.string(),
});

/** Parolni tiklash, 2-bosqich: SMS kod + yangi parol. */
export async function completeResetAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const parsed = completeResetSchema.safeParse({
    phone: formData.get("phone"),
    code: formData.get("code"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: "INVALID_INPUT" };
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: "PASSWORD_MISMATCH" };
  }

  const phone = normalizeUzPhone(parsed.data.phone);
  if (!phone) return { error: "INVALID_PHONE" };

  const codeError = await checkCode(phone, VerificationPurpose.RESET, parsed.data.code);
  if (codeError) return { error: codeError };

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return { error: "PHONE_NOT_FOUND" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.phoneVerification.deleteMany({
    where: { phone, purpose: VerificationPurpose.RESET },
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

  const phone = normalizeUzPhone(parsed.data.phone) ?? lenientPhone(parsed.data.phone);
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return { error: "INVALID_CREDENTIALS" };
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { error: "INVALID_CREDENTIALS" };
  }

  if (user.blocked) {
    return { error: "ACCOUNT_BLOCKED" };
  }

  await createSession(user.id);
  redirect(`/${locale}/dashboard`);
}

export async function logoutAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get("locale"));
  await destroySession();
  redirect(`/${locale}/login`);
}
