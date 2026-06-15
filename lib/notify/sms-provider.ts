import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

// sms.identify.uz (smsprovider) bilan integratsiya.
// Har bir biznesga alohida smsprovider akkaunt + API kalit ochiladi. Shunda:
//  - "own"  -> biznesning O'Z ulangan telefoni orqali yuboriladi
//  - "gateway" -> umumiy (admin) raqam orqali yuboriladi
// Akkaunt PROVISION_SECRET bilan ochilgani uchun smsprovider tomonida narx 0 —
// hisob pdaftar tomonida smsBalance orqali yuritiladi.

const BASE_URL = (process.env.IDENTIFY_SMS_BASE_URL || "https://sms.identify.uz").replace(/\/$/, "");
const PROVISION_SECRET = process.env.SMS_PROVISION_SECRET;

type Provisioned = { ok: true; apiKey: string } | { ok: false; error: string };

/** Provision qilinadigan smsprovider akkaunt emaili (biznes id'siga bog'liq, barqaror). */
function accountEmail(businessId: string): string {
  return `biz-${businessId}@pdaftar.identify.uz`;
}

async function postJson(path: string, body: unknown, token?: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data } as { res: Response; data: Record<string, unknown> };
}

/**
 * Biznes uchun smsprovider akkaunt + API kalitni kafolatlaydi (idempotent).
 * Allaqachon bo'lsa mavjud kalitni qaytaradi.
 */
export async function ensureSmsAccount(businessId: string): Promise<Provisioned> {
  const biz = await prisma.business.findUnique({ where: { id: businessId } });
  if (!biz) return { ok: false, error: "NOT_FOUND" };
  if (biz.smsApiKey) return { ok: true, apiKey: biz.smsApiKey };

  const email = biz.smsUserEmail || accountEmail(biz.id);
  const password = biz.smsPassword || randomBytes(18).toString("base64url");

  try {
    // 1) Akkaunt yaratish (yoki mavjud bo'lsa — login). provisionSecret -> free akkaunt.
    let token: string | null = null;
    const reg = await postJson("/auth/register", {
      email,
      password,
      name: biz.name,
      provisionSecret: PROVISION_SECRET,
    });
    if (reg.res.ok && typeof reg.data.token === "string") {
      token = reg.data.token;
    } else if (reg.res.status === 409) {
      const login = await postJson("/auth/login", { email, password });
      if (login.res.ok && typeof login.data.token === "string") token = login.data.token;
    }
    if (!token) {
      return { ok: false, error: (reg.data.error as string) || "PROVISION_FAILED" };
    }

    // 2) API kalit yaratish (faqat shu yerda ochiq ko'rinadi).
    const key = await postJson("/v1/keys", { name: "pdaftar" }, token);
    const apiKey = key.data.key as string | undefined;
    if (!apiKey) return { ok: false, error: (key.data.error as string) || "KEY_FAILED" };

    // 3) Saqlash.
    await prisma.business.update({
      where: { id: biz.id },
      data: { smsUserEmail: email, smsPassword: password, smsApiKey: apiKey },
    });
    return { ok: true, apiKey };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "NETWORK" };
  }
}

export type PairingInfo = {
  ok: true;
  qr: string; // data:image/png;base64,...
  code: string;
  url: string;
  expiresAt: string;
};

/** Telefonni ulash uchun QR + kod yaratadi (smsprovider ilovasi skanerlaydi). */
export async function createPairing(businessId: string): Promise<PairingInfo | { ok: false; error: string }> {
  const acc = await ensureSmsAccount(businessId);
  if (!acc.ok) return acc;
  // /pair/new API kalit bilan ham ishlaydi (smsprovider'da authAny).
  try {
    const res = await fetch(`${BASE_URL}/pair/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${acc.apiKey}` },
      body: JSON.stringify({}),
    });
    const data = (await res.json().catch(() => ({}))) as {
      qr?: string;
      code?: string;
      url?: string;
      expiresAt?: string;
      error?: string;
    };
    if (!res.ok || !data.qr || !data.code) {
      return { ok: false, error: data.error || `PAIR_FAILED (HTTP ${res.status})` };
    }
    return { ok: true, qr: data.qr, code: data.code, url: data.url || BASE_URL, expiresAt: data.expiresAt || "" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "NETWORK" };
  }
}

export type SmsStatus = {
  ok: true;
  ownConnected: boolean; // biznesning o'z telefoni ulanganmi
  ownOnline: boolean; // o'z telefoni hozir onlinemi
  devices: { id: string; name: string | null; online: boolean; battery: number | null; network: string | null }[];
  gatewayOnline: boolean; // umumiy raqam onlinemi
};

/** Biznes akkauntining telefon/gateway holatini qaytaradi. */
export async function getSmsStatus(businessId: string): Promise<SmsStatus | { ok: false; error: string }> {
  const acc = await ensureSmsAccount(businessId);
  if (!acc.ok) return acc;
  try {
    const res = await fetch(`${BASE_URL}/v1/overview`, {
      headers: { Authorization: `Bearer ${acc.apiKey}` },
    });
    const data = (await res.json().catch(() => ({}))) as {
      devices?: { id: string; name: string | null; online: boolean; battery: number | null; network: string | null }[];
      gateway?: { online: boolean; count: number };
      error?: string;
    };
    if (!res.ok) return { ok: false, error: data.error || `STATUS_FAILED (HTTP ${res.status})` };
    const devices = data.devices || [];
    return {
      ok: true,
      ownConnected: devices.length > 0,
      ownOnline: devices.some((d) => d.online),
      devices,
      gatewayOnline: !!data.gateway?.online,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "NETWORK" };
  }
}
