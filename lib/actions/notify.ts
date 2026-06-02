"use server";

import { z } from "zod";
import { getActiveBusinessId } from "@/lib/user";
import { sendReminder, type Channel } from "@/lib/notify";
import { isLocale, defaultLocale } from "@/i18n/config";

export type NotifyResult =
  | { ok: true; status: "SENT" | "FAILED" | "MOCK"; channel: "SMS" | "TELEGRAM" }
  | { ok: false; error: string };

function loc(value: FormDataEntryValue | null): "uz" | "en" {
  const v = typeof value === "string" ? value : "";
  return (isLocale(v) ? v : defaultLocale) as "uz" | "en";
}

const schema = z.object({
  debtId: z.string().min(1),
  channel: z.enum(["AUTO", "SMS", "TELEGRAM"]),
  templateId: z.string().optional(),
});

export async function sendReminderAction(formData: FormData): Promise<NotifyResult> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: "UNAUTHORIZED" };

  const parsed = schema.safeParse({
    debtId: formData.get("debtId"),
    channel: formData.get("channel"),
    templateId: formData.get("templateId") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const outcome = await sendReminder({
    businessId,
    debtId: parsed.data.debtId,
    channel: parsed.data.channel as Channel,
    locale: loc(formData.get("locale")),
    templateId: parsed.data.templateId,
  });

  if (!outcome.ok) return { ok: false, error: outcome.error };
  return { ok: true, status: outcome.status, channel: outcome.channel };
}
