import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/user";
import { getUserSessions } from "@/lib/rate-limit";
import { getSessionId } from "@/lib/session";
import { SessionsClient } from "@/components/dashboard/SessionsClient";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.dashboard.settings;

  const me = await getCurrentUser();
  if (!me) redirect(`/${locale}/login`);

  const sessions = await getUserSessions(me.id);
  const currentSessionId = await getSessionId();

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">{t.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.subtitle}</p>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-ink">{t.devices}</h2>
        <p className="mt-1 text-sm text-muted">{t.devicesSubtitle}</p>

        <SessionsClient
          sessions={sessions.map((s) => ({
            id: s.id,
            ip: s.ip,
            device: s.device ?? "Unknown",
            browser: s.browser ?? "Unknown",
            os: s.os ?? "Unknown",
            lastActive: s.lastActive.toISOString(),
            createdAt: s.createdAt.toISOString(),
            isCurrent: s.id === currentSessionId,
          }))}
          dict={t}
          locale={locale}
        />
      </div>
    </div>
  );
}
