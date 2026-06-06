import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyInitData } from "@/lib/tma/verify";
import { bindAndLogin } from "@/lib/tma/auth-server";

export const runtime = "nodejs";

type Body = {
  initData?: string;
  contact?: { phone_number?: string };
  phone?: string;
  password?: string;
};

/**
 * Mirrors the loose normalization used by register/login (lib/actions/auth.ts),
 * since User.phone was stored that way. For valid Uzbek numbers this agrees with
 * the strict lib/phone.ts normalizer.
 */
function normalizePhoneLoose(value: string): string {
  const trimmed = (value || "").replace(/[\s()-]/g, "");
  return trimmed.startsWith("+") ? trimmed : `+${trimmed.replace(/^00/, "")}`;
}

/**
 * Hybrid account linking. Identity of WHO operates the app always comes from the
 * verified initData; the phone/contact/password only proves which platform
 * account to bind. On success the tg id is bound and a session is started.
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  // Re-verify on every privileged call — never trust a previous /auth result.
  const v = verifyInitData(body.initData ?? "");
  if (!v.ok) {
    return NextResponse.json({ error: "INVALID_INITDATA", reason: v.reason }, { status: 401 });
  }
  const telegramUserId = String(v.user.id);

  let userId: string | null = null;

  if (body.contact?.phone_number) {
    // Phone-share path: Telegram verifies the contact is the user's own number.
    const phone = normalizePhoneLoose(body.contact.phone_number);
    const match = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (!match) return NextResponse.json({ error: "PHONE_NO_MATCH" });
    userId = match.id;
  } else if (body.phone && body.password) {
    // Password fallback — same check as loginAction.
    const phone = normalizePhoneLoose(body.phone);
    const candidate = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, passwordHash: true },
    });
    if (!candidate) return NextResponse.json({ error: "INVALID_CREDENTIALS" });
    const ok = await bcrypt.compare(body.password, candidate.passwordHash);
    if (!ok) return NextResponse.json({ error: "INVALID_CREDENTIALS" });
    userId = candidate.id;
  } else {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const outcome = await bindAndLogin(userId, telegramUserId);
  if (!outcome.ok) return NextResponse.json({ error: outcome.error });

  return NextResponse.json({ status: "authed" });
}
