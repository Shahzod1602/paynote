import "server-only";
import type { SendResult } from "./telegram";

const BASE_URL = process.env.IDENTIFY_SMS_BASE_URL || "https://sms.identify.uz";

/** identify.uz expects an E.164 number like +998901234567. */
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // 9 raqamli lokal raqam (901234567) bo'lsa 998 prefiksini qo'shamiz.
  const full = digits.length === 9 ? `998${digits}` : digits;
  return `+${full}`;
}

/**
 * Sends an SMS via sms.identify.uz (https://sms.identify.uz/docs).
 * If IDENTIFY_SMS_API_KEY is not set, runs in MOCK mode (logs only, no network).
 * Provider-agnostic: swap this file to use another gateway without touching callers.
 */
export async function sendSms(phone: string, text: string): Promise<SendResult> {
  const apiKey = process.env.IDENTIFY_SMS_API_KEY;

  if (!apiKey) {
    console.log(`[notify:sms MOCK] → ${phone}: ${text}`);
    return { status: "MOCK" };
  }

  try {
    const body: Record<string, unknown> = {
      to: toE164(phone),
      text,
    };
    // Ixtiyoriy SIM tanlash (1 yoki 2).
    const sim = process.env.IDENTIFY_SMS_SIM;
    if (sim) body.sim = Number(sim);

    const res = await fetch(`${BASE_URL}/v1/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      status?: string;
      error?: string;
      message?: string;
    };

    // 2xx + id (status: queued) qaytsa — qabul qilingan.
    if (res.ok && data.id) {
      return { status: "SENT" };
    }
    return {
      status: "FAILED",
      error: data.error ?? data.message ?? `identify.uz error (HTTP ${res.status})`,
    };
  } catch (e) {
    return { status: "FAILED", error: e instanceof Error ? e.message : "Network error" };
  }
}
