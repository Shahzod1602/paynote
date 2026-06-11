import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, getSessionId, destroySession } from "@/lib/session";
import { revokeSession } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Mini App "Chiqish": unlinks this Telegram from the account and kills the
 * session. Unlinking matters — otherwise the next open would silently
 * re-authenticate via initData and logout would be a no-op.
 */
export async function POST() {
  const userId = await getUserId();
  const sessionId = await getSessionId();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  if (sessionId) await revokeSession(sessionId, userId);
  await prisma.user.update({ where: { id: userId }, data: { telegramUserId: null } });
  await destroySession();
  return NextResponse.json({ ok: true });
}
