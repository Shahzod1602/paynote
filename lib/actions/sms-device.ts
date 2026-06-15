"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActiveBusinessId } from "@/lib/user";
import { createPairing, getSmsStatus } from "@/lib/notify/sms-provider";

export type PairingResult =
  | { ok: true; qr: string; code: string; url: string; expiresAt: string }
  | { ok: false; error: string };

export type DeviceStatusResult =
  | {
      ok: true;
      ownConnected: boolean;
      ownOnline: boolean;
      gatewayOnline: boolean;
      devices: { id: string; name: string | null; online: boolean; battery: number | null; network: string | null }[];
      via: string;
    }
  | { ok: false; error: string };

/** Telefonni ulash uchun QR + kod yaratadi. */
export async function startPairingAction(): Promise<PairingResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };
  const res = await createPairing(businessId);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, qr: res.qr, code: res.code, url: res.url, expiresAt: res.expiresAt };
}

/** Telefon/gateway holatini va standart usulni qaytaradi. */
export async function getDeviceStatusAction(): Promise<DeviceStatusResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };
  const [status, biz] = await Promise.all([
    getSmsStatus(businessId),
    prisma.business.findUnique({ where: { id: businessId }, select: { smsVia: true } }),
  ]);
  if (!status.ok) return { ok: false, error: status.error };
  return {
    ok: true,
    ownConnected: status.ownConnected,
    ownOnline: status.ownOnline,
    gatewayOnline: status.gatewayOnline,
    devices: status.devices,
    via: biz?.smsVia ?? "gateway",
  };
}

/** Standart SMS yuborish usulini o'rnatadi (own/gateway). */
export async function setDefaultViaAction(via: "own" | "gateway"): Promise<{ ok: boolean; error?: string }> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };
  if (via !== "own" && via !== "gateway") return { ok: false, error: "INVALID_INPUT" };
  await prisma.business.update({ where: { id: businessId }, data: { smsVia: via } });
  revalidatePath("/[locale]/dashboard/settings", "page");
  return { ok: true };
}
