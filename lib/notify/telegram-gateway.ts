import "server-only";
import type { SendResult } from "./telegram";

// Telegram Gateway — rasmiy OTP xizmati (https://core.telegram.org/gateway).
// Kodni sizning botingiz emas, Telegram'ning o'zi rasmiy "Telegram" akkaunti
// orqali yetkazadi. Faqat shu raqamda faol Telegram akkaunti bo'lsa ishlaydi.
const BASE_URL = "https://gatewayapi.telegram.org";

/** Telegram Gateway E.164 (+998901234567) formatdagi raqamni kutadi. */
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // 9 raqamli lokal raqam (901234567) bo'lsa 998 prefiksini qo'shamiz.
  const full = digits.length === 9 ? `998${digits}` : digits;
  return `+${full}`;
}

type GatewayResponse = {
  ok: boolean;
  error?: string;
  result?: { request_id?: string };
};

async function call(
  method: string,
  token: string,
  params: Record<string, unknown>
): Promise<GatewayResponse> {
  const res = await fetch(`${BASE_URL}/${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return (await res
    .json()
    .catch(() => ({ ok: false, error: `HTTP ${res.status}` }))) as GatewayResponse;
}

/**
 * Bizning 5 xonali kodimizni Telegram Gateway orqali yetkazadi.
 * Faqat Telegram yetkazishni qabul qilsa "SENT" qaytaradi; boshqa har qanday holat
 * (token sozlanmagan, raqam Telegram'da yo'q, API xatosi) "FAILED" qaytaradi —
 * shunda chaqiruvchi SMS'ga qaytadi (fallback).
 */
export async function sendTelegramCode(phone: string, code: string): Promise<SendResult> {
  const token = process.env.TELEGRAM_GATEWAY_TOKEN;
  if (!token) return { status: "FAILED", error: "DISABLED" };

  const phoneNumber = toE164(phone);
  try {
    // 1) Bepul oldindan tekshiruv: raqam Telegram'da bo'lmasa, pul to'lamasdan o'tkazib yuboramiz.
    const ability = await call("checkSendAbility", token, { phone_number: phoneNumber });
    if (!ability.ok || !ability.result?.request_id) {
      return { status: "FAILED", error: ability.error ?? "NOT_ON_TELEGRAM" };
    }
    // 2) O'zimiz yaratgan kodni shu so'rovga bog'lab yuboramiz.
    const sent = await call("sendVerificationMessage", token, {
      phone_number: phoneNumber,
      request_id: ability.result.request_id,
      code,
    });
    if (!sent.ok) return { status: "FAILED", error: sent.error ?? "SEND_FAILED" };
    return { status: "SENT" };
  } catch (e) {
    return { status: "FAILED", error: e instanceof Error ? e.message : "Network error" };
  }
}
