import "server-only";

export type SendResult = { status: "SENT" | "FAILED" | "MOCK"; error?: string };

/**
 * Sends a Telegram message via the Bot API.
 * If TELEGRAM_BOT_TOKEN is not set, runs in MOCK mode (logs only, no network).
 */
export async function sendTelegram(chatId: string, text: string): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.log(`[notify:telegram MOCK] → ${chatId}: ${text}`);
    return { status: "MOCK" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!data.ok) return { status: "FAILED", error: data.description ?? "Telegram error" };
    return { status: "SENT" };
  } catch (e) {
    return { status: "FAILED", error: e instanceof Error ? e.message : "Network error" };
  }
}
