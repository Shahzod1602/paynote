import "server-only";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export type LinkError = "TG_ALREADY_LINKED" | "ACCOUNT_LINKED_ELSEWHERE";
export type LinkOutcome = { ok: true } | { ok: false; error: LinkError };

/**
 * Binds a verified Telegram user id to a platform user, then starts the normal
 * `pdaftar_session` cookie session (so every existing server action works as-is).
 * Refuses if the tg id belongs to someone else, or the account is already bound
 * to a different tg id.
 */
export async function bindAndLogin(userId: string, telegramUserId: string): Promise<LinkOutcome> {
  const tgOwner = await prisma.user.findUnique({
    where: { telegramUserId },
    select: { id: true },
  });
  if (tgOwner && tgOwner.id !== userId) return { ok: false, error: "TG_ALREADY_LINKED" };

  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramUserId: true },
  });
  if (account?.telegramUserId && account.telegramUserId !== telegramUserId) {
    return { ok: false, error: "ACCOUNT_LINKED_ELSEWHERE" };
  }

  if (!account?.telegramUserId) {
    await prisma.user.update({ where: { id: userId }, data: { telegramUserId } });
  }

  await createSession(userId);
  return { ok: true };
}
