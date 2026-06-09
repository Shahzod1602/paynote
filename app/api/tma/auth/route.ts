import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { verifyInitData, localeFromLanguageCode } from "@/lib/tma/verify";
import { createLoginSession } from "@/lib/rate-limit";

// node:crypto inside verifyInitData → must run on the Node runtime.
export const runtime = "nodejs";

/**
 * Bootstrap: the Mini App posts its `initData` here on open.
 * - Telegram user already linked → start a session → { status: "authed" }.
 * - Not linked → { status: "needs_link" } (client then runs the linking flow).
 */
export async function POST(req: NextRequest) {
  let body: { initData?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const v = verifyInitData(body.initData ?? "");
  if (!v.ok) {
    return NextResponse.json({ status: "invalid", reason: v.reason }, { status: 401 });
  }

  const locale = localeFromLanguageCode(v.user.language_code);
  const telegramUserId = String(v.user.id);

  const user = await prisma.user.findUnique({
    where: { telegramUserId },
    select: { id: true, name: true },
  });

  if (!user) {
    return NextResponse.json({
      status: "needs_link",
      locale,
      tgName: v.user.first_name ?? v.user.username ?? null,
    });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ua = req.headers.get("user-agent") ?? "";
  const session = await createLoginSession(user.id, ip, ua);
  await createSession(user.id, session.id);
  return NextResponse.json({ status: "authed", locale, user: { name: user.name } });
}
