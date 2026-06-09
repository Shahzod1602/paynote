import "server-only";
import { headers } from "next/headers";
import { prisma } from "./prisma";
import type { RateLimitAction } from "@prisma/client";

const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 30 * 60 * 1000;

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

export function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  let device = "Desktop";
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    device = /ipad|tablet/i.test(ua) ? "Tablet" : "Mobile";
  }

  let browser = "Unknown";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/opera|opr\//i.test(ua)) browser = "Opera";

  let os = "Unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod|ios/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { device, browser, os };
}

export async function checkRateLimit(
  ip: string,
  action: RateLimitAction
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const record = await prisma.rateLimit.findUnique({
    where: { ip_action: { ip, action } },
  });

  if (!record) return { allowed: true };

  if (record.blockedUntil && record.blockedUntil.getTime() > Date.now()) {
    const retryAfter = Math.ceil(
      (record.blockedUntil.getTime() - Date.now()) / 1000
    );
    return { allowed: false, retryAfter };
  }

  if (record.blockedUntil && record.blockedUntil.getTime() <= Date.now()) {
    await prisma.rateLimit.update({
      where: { id: record.id },
      data: { attempts: 1, blockedUntil: null },
    });
    return { allowed: true };
  }

  return { allowed: true };
}

export async function recordFailedAttempt(
  ip: string,
  action: RateLimitAction
): Promise<{ blocked: boolean; blockedUntil?: Date }> {
  const existing = await prisma.rateLimit.findUnique({
    where: { ip_action: { ip, action } },
  });

  if (!existing) {
    await prisma.rateLimit.create({
      data: { ip, action, attempts: 1 },
    });
    return { blocked: false };
  }

  const newAttempts = existing.attempts + 1;

  if (newAttempts >= MAX_ATTEMPTS) {
    const blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS);
    await prisma.rateLimit.update({
      where: { id: existing.id },
      data: { attempts: newAttempts, blockedUntil },
    });
    return { blocked: true, blockedUntil };
  }

  await prisma.rateLimit.update({
    where: { id: existing.id },
    data: { attempts: newAttempts },
  });
  return { blocked: false };
}

export async function clearRateLimit(ip: string, action: RateLimitAction) {
  await prisma.rateLimit.deleteMany({ where: { ip, action } });
}

export async function createLoginSession(
  userId: string,
  ip: string,
  userAgent: string
) {
  const { device, browser, os } = parseUserAgent(userAgent);
  return prisma.loginSession.create({
    data: { userId, ip, userAgent, device, browser, os },
  });
}

export async function updateSessionActivity(sessionId: string) {
  await prisma.loginSession
    .update({
      where: { id: sessionId },
      data: { lastActive: new Date() },
    })
    .catch(() => {});
}

export async function revokeSession(sessionId: string, userId: string) {
  await prisma.loginSession.deleteMany({
    where: { id: sessionId, userId },
  });
}

export async function getUserSessions(userId: string) {
  return prisma.loginSession.findMany({
    where: { userId },
    orderBy: { lastActive: "desc" },
  });
}
