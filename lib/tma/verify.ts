// Telegram Mini App `initData` verification (server-side only — uses node:crypto
// and TELEGRAM_BOT_TOKEN). Pure module (no "server-only" so it stays unit-testable
// via tsx); the boundary is enforced by it being imported only from route handlers.
import { createHmac, timingSafeEqual } from "node:crypto";

export type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
};

export type VerifyReason =
  | "NO_TOKEN"
  | "MALFORMED"
  | "NO_HASH"
  | "BAD_HASH"
  | "STALE"
  | "NO_USER";

export type VerifyResult =
  | { ok: true; user: TgUser; authDate: number; params: URLSearchParams }
  | { ok: false; reason: VerifyReason };

const DEFAULT_MAX_AGE_SEC = 3600; // 1 soat — replay/eskirish himoyasi

/**
 * Verifies a Telegram WebApp `initData` query-string per
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * secret_key = HMAC_SHA256(key="WebAppData", msg=bot_token)
 * hash       = HMAC_SHA256(key=secret_key, msg=data_check_string)
 * where data_check_string = "key=value" pairs (except `hash`), sorted by key, joined by "\n".
 */
export function verifyInitData(
  initData: string,
  opts: { botToken?: string; maxAgeSec?: number; now?: number } = {}
): VerifyResult {
  const botToken = opts.botToken ?? process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return { ok: false, reason: "NO_TOKEN" };
  if (!initData || typeof initData !== "string") return { ok: false, reason: "MALFORMED" };

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return { ok: false, reason: "MALFORMED" };
  }

  const hash = params.get("hash");
  if (!hash) return { ok: false, reason: "NO_HASH" };

  // data_check_string — every field except `hash`, sorted by key, joined by "\n".
  const pairs: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  // Constant-time compare (guard length first — timingSafeEqual throws on mismatch).
  const aBuf = Buffer.from(computed, "hex");
  const bBuf = Buffer.from(hash, "hex");
  if (aBuf.length !== bBuf.length || !timingSafeEqual(aBuf, bBuf)) {
    return { ok: false, reason: "BAD_HASH" };
  }

  // Freshness.
  const authDate = Number(params.get("auth_date") ?? "0");
  const maxAge = opts.maxAgeSec ?? DEFAULT_MAX_AGE_SEC;
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate) || authDate <= 0 || now - authDate > maxAge) {
    return { ok: false, reason: "STALE" };
  }

  // Operating user — the only trustworthy identity.
  const userRaw = params.get("user");
  if (!userRaw) return { ok: false, reason: "NO_USER" };
  let user: TgUser;
  try {
    user = JSON.parse(userRaw) as TgUser;
  } catch {
    return { ok: false, reason: "MALFORMED" };
  }
  if (typeof user?.id !== "number") return { ok: false, reason: "NO_USER" };

  return { ok: true, user, authDate, params };
}

/** Maps a Telegram language_code to one of our supported locales. */
export function localeFromLanguageCode(code: string | undefined): "uz" | "en" {
  if (!code) return "uz";
  if (code.toLowerCase().startsWith("en")) return "en";
  return "uz"; // uz/ru/default → uz UI
}
