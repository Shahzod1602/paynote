import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";

type TgUpdate = {
  message?: {
    chat?: { id: number; first_name?: string; last_name?: string; username?: string; type?: string };
    from?: { id: number; first_name?: string; last_name?: string; username?: string };
  };
};

/**
 * Returns recent people who messaged the bot (pressed /start), so a chat_id
 * can be picked instead of typed. Auth-protected (dashboard session required).
 */
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ configured: false, contacts: [] });

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, { cache: "no-store" });
    const data = (await res.json()) as { ok: boolean; result?: TgUpdate[] };
    if (!data.ok || !data.result) return NextResponse.json({ configured: true, contacts: [] });

    const byChat = new Map<number, { chatId: string; name: string; username: string | null }>();
    for (const u of data.result) {
      const chat = u.message?.chat;
      if (!chat || chat.type !== "private") continue;
      const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.username || String(chat.id);
      byChat.set(chat.id, { chatId: String(chat.id), name, username: chat.username ?? null });
    }

    return NextResponse.json({ configured: true, contacts: Array.from(byChat.values()).reverse() });
  } catch (e) {
    return NextResponse.json({ configured: true, contacts: [], error: e instanceof Error ? e.message : "error" });
  }
}
