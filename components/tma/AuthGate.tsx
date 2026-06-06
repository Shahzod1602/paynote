"use client";

import { useEffect, useRef, useState } from "react";
import { useTelegram } from "./useTelegram";
import { getStrings, pickLocale, type TmaStrings } from "./strings";
import { PrimaryButton, Spinner } from "./ui";

type Stage = "loading" | "no_tg" | "needs_link";

function mapError(code: string | undefined, s: TmaStrings): string {
  switch (code) {
    case "PHONE_NO_MATCH":
      return s.errPhoneNoMatch;
    case "INVALID_CREDENTIALS":
      return s.errInvalidCreds;
    case "TG_ALREADY_LINKED":
      return s.errTgLinked;
    case "ACCOUNT_LINKED_ELSEWHERE":
      return s.errAccountLinked;
    case "INVALID_INITDATA":
      return s.errInvalidInit;
    default:
      return s.errGeneric;
  }
}

export function AuthGate({ onAuthed }: { onAuthed: () => void }) {
  const { ready, initData, user, requestContact, haptic } = useTelegram();
  const s = getStrings(pickLocale(user?.language_code));
  const [stage, setStage] = useState<Stage>("loading");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (!ready || bootstrapped.current) return;
    bootstrapped.current = true;

    void (async () => {
      if (!initData) {
        setStage("no_tg");
        return;
      }
      try {
        const res = await fetch("/api/tma/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.status === "authed") {
          haptic("success");
          onAuthed();
        } else if (data.status === "needs_link") {
          setStage("needs_link");
        } else {
          setStage("needs_link");
          setErr(s.errInvalidInit);
        }
      } catch {
        setStage("needs_link");
        setErr(s.errGeneric);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, initData]);

  async function doLink(payload: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/tma/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.status === "authed") {
        haptic("success");
        onAuthed();
        return;
      }
      haptic("error");
      setErr(mapError(data.error, s));
    } catch {
      setErr(s.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function shareContact() {
    setBusy(true);
    setErr(null);
    const phone = await requestContact();
    if (!phone) {
      setErr(s.contactNoPhone);
      setBusy(false);
      return;
    }
    await doLink({ contact: { phone_number: phone } });
  }

  function submitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    void doLink({ phone: String(fd.get("phone") ?? ""), password: String(fd.get("password") ?? "") });
  }

  if (stage === "loading") {
    return (
      <div className="tma-app flex min-h-screen flex-col items-center justify-center gap-3">
        <Spinner className="tma-accent h-8 w-8" />
        <p className="tma-hint text-sm">{s.connecting}</p>
      </div>
    );
  }

  if (stage === "no_tg") {
    return (
      <div className="tma-app flex min-h-screen flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="text-4xl">📲</div>
        <p className="tma-text text-base font-medium">{s.openInTelegram}</p>
      </div>
    );
  }

  return (
    <div className="tma-app flex min-h-screen flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="tma-text text-2xl font-extrabold tracking-tight">{s.linkTitle}</h1>
        <p className="tma-hint mt-2 text-sm">{s.linkSubtitle}</p>

        <div className="mt-7 space-y-4">
          <PrimaryButton onClick={shareContact} loading={busy}>
            {s.sharePhone}
          </PrimaryButton>

          <div className="flex items-center gap-3">
            <div className="tma-sep h-px flex-1 border-t" />
            <span className="tma-hint text-xs">{s.orPassword}</span>
            <div className="tma-sep h-px flex-1 border-t" />
          </div>

          <form onSubmit={submitPassword} className="space-y-3">
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="+998 90 123 45 67"
              className="tma-field w-full rounded-xl border px-3.5 py-3 text-base outline-none focus:border-[var(--tg-button)]"
            />
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder={s.password}
              className="tma-field w-full rounded-xl border px-3.5 py-3 text-base outline-none focus:border-[var(--tg-button)]"
            />
            <PrimaryButton type="submit" loading={busy}>
              {s.login}
            </PrimaryButton>
          </form>

          {err && (
            <p className="rounded-xl bg-rose-100 px-3.5 py-2.5 text-sm text-rose-700">{err}</p>
          )}
        </div>
      </div>
    </div>
  );
}
