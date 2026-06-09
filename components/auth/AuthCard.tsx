"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/lib/utils";
import { loginAction, type AuthState } from "@/lib/actions/auth";
import { DEMO_USER } from "@/lib/auth";
import { AuthShell, Field, SubmitButton } from "./AuthShell";
import { errorMessage, type AuthDict } from "./types";

export function AuthCard({ locale, dict }: { locale: Locale; dict: AuthDict }) {
  const [state, formAction] = useActionState<AuthState, FormData>(loginAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const error = errorMessage(state.error, dict);

  function loginAsDemo() {
    if (phoneRef.current) phoneRef.current.value = DEMO_USER.phone;
    if (passwordRef.current) passwordRef.current.value = DEMO_USER.password;
    formRef.current?.requestSubmit();
  }

  return (
    <AuthShell locale={locale} title={dict.loginTitle} subtitle={dict.loginSubtitle} backHome={dict.backHome}>
      <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-3.5">
        <p className="text-xs font-semibold text-brand-800">{dict.demoTitle}</p>
        <p className="mt-1 text-xs text-brand-700">{dict.demoHint}</p>
        <button
          type="button"
          onClick={loginAsDemo}
          className="mt-3 w-full rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          {dict.demoFill}
        </button>
      </div>

      <form ref={formRef} action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <Field
          label={dict.phone}
          name="phone"
          type="tel"
          placeholder="+998 90 123 45 67"
          inputRef={phoneRef}
          autoComplete="tel"
          inputMode="tel"
        />
        <Field
          label={dict.password}
          name="password"
          type="password"
          placeholder="••••••••"
          inputRef={passwordRef}
          autoComplete="current-password"
        />

        <div className="text-right">
          <Link
            href={localePath(locale, "/reset")}
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            {dict.forgotPassword}
          </Link>
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <SubmitButton label={dict.loginButton} />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {dict.noAccount}{" "}
        <Link href={localePath(locale, "/register")} className="font-semibold text-brand-700 hover:underline">
          {dict.signUp}
        </Link>
      </p>
    </AuthShell>
  );
}
