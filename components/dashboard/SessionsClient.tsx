"use client";

import { useActionState, useTransition } from "react";
import { revokeSessionAction, type SessionActionState } from "@/lib/actions/sessions";

type Session = {
  id: string;
  ip: string;
  device: string;
  browser: string;
  os: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
};

type Dict = {
  currentDevice: string;
  otherDevices: string;
  revoke: string;
  revokeConfirm: string;
  noDevices: string;
  lastActive: string;
  joined: string;
};

const deviceIcons: Record<string, string> = {
  Mobile: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm5 17h.01",
  Tablet: "M5 1h14a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm7 19h.01",
  Desktop: "M3 4h18v12H3zM8 20h8M12 16v4",
};

function timeAgo(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === "uz" ? "hozir" : "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function RevokeButton({ sessionId, dict }: { sessionId: string; dict: Dict }) {
  const [, formAction] = useActionState<SessionActionState, FormData>(
    revokeSessionAction,
    {}
  );
  const [pending, startTransition] = useTransition();

  function handleSubmit(fd: FormData) {
    if (!confirm(dict.revokeConfirm)) return;
    startTransition(() => formAction(fd));
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {dict.revoke}
      </button>
    </form>
  );
}

export function SessionsClient({
  sessions,
  dict,
  locale,
}: {
  sessions: Session[];
  dict: Dict;
  locale: string;
}) {
  const current = sessions.find((s) => s.isCurrent);
  const others = sessions.filter((s) => !s.isCurrent);

  if (sessions.length === 0) {
    return <p className="mt-4 text-sm text-muted">{dict.noDevices}</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {current && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-brand-600">
                <path
                  d={deviceIcons[current.device] ?? deviceIcons.Desktop}
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <p className="font-semibold text-ink">
                  {current.browser} · {current.os}
                </p>
                <p className="text-xs text-muted">
                  {current.device} · {current.ip}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-bold text-white">
              {dict.currentDevice}
            </span>
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {dict.otherDevices} ({others.length})
          </p>
          <div className="space-y-2">
            {others.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-line bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-muted">
                    <path
                      d={deviceIcons[s.device] ?? deviceIcons.Desktop}
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-ink">
                      {s.browser} · {s.os}
                    </p>
                    <p className="text-xs text-muted">
                      {s.device} · {s.ip} · {dict.lastActive}: {timeAgo(s.lastActive, locale)}
                    </p>
                  </div>
                </div>
                <RevokeButton sessionId={s.id} dict={dict} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
