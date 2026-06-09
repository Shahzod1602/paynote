"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/lib/utils";
import { formatPhone } from "@/lib/phone";
import { startResetAction, completeResetAction, type AuthState } from "@/lib/actions/auth";
import { AuthShell, Field, SubmitButton } from "./AuthShell";
import { errorMessage, type AuthDict } from "./types";

// Parolni tiklash: (1) telefon → SMS kod, (2) kod + yangi parol.
export function ResetCard({ locale, dict }: { locale: Locale; dict: AuthDict }) {
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phone, setPhone] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const [startState, startFormAction] = useActionState<AuthState, FormData>(startResetAction, {});
  const [completeState, completeFormAction] = useActionState<AuthState, FormData>(completeResetAction, {});

  // Kod yuborilgach verify bosqichiga o'tamiz (renderda moslash, effekt emas).
  const [prevStartState, setPrevStartState] = useState(startState);
  if (prevStartState !== startState) {
    setPrevStartState(startState);
    if (startState.sent) {
      setStep("verify");
      setCooldown(60);
    }
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const startError = errorMessage(startState.error, dict);
  const completeError = errorMessage(completeState.error, dict);
  const isVerify = step === "verify";

  return (
    <AuthShell
      locale={locale}
      title={dict.resetTitle}
      subtitle={isVerify ? `${dict.codeSentTo} ${formatPhone(phone)}` : dict.resetSubtitle}
      backHome={dict.backHome}
    >
      {!isVerify && (
        <form action={startFormAction} className="mt-6 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <Field
            label={dict.phone}
            name="phone"
            type="tel"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
          />

          {startError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{startError}</p>}

          <SubmitButton label={dict.sendCode} />
        </form>
      )}

      {isVerify && (
        <>
          <form action={completeFormAction} className="mt-6 space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="phone" value={phone} />
            <Field
              label={dict.code}
              name="code"
              type="text"
              placeholder="123456"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
            />
            <Field
              label={dict.newPassword}
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <Field
              label={dict.confirmPassword}
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
            />

            {completeError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{completeError}</p>
            )}

            <SubmitButton label={dict.resetButton} />
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <form action={startFormAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="phone" value={phone} />
              <button
                type="submit"
                disabled={cooldown > 0}
                className="font-semibold text-brand-700 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
              >
                {cooldown > 0 ? `${dict.resend} (${cooldown}s)` : dict.resend}
              </button>
            </form>
            <button type="button" onClick={() => setStep("phone")} className="text-muted hover:text-ink">
              {dict.changePhone}
            </button>
          </div>
          {startError && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{startError}</p>
          )}
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link href={localePath(locale, "/login")} className="font-semibold text-brand-700 hover:underline">
          {dict.signIn}
        </Link>
      </p>
    </AuthShell>
  );
}
