"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Logo } from "@/components/Logo";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/lib/utils";
import { loginAction, registerAction, type AuthState } from "@/lib/actions/auth";
import { DEMO_USER } from "@/lib/auth";

type Mode = "login" | "register";

type AuthDict = {
  loginTitle: string;
  loginSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  loginButton: string;
  registerButton: string;
  noAccount: string;
  haveAccount: string;
  signUp: string;
  signIn: string;
  backHome: string;
  invalid: string;
  phoneTaken: string;
  invalidInput: string;
  demoTitle: string;
  demoHint: string;
  demoFill: string;
};

function errorMessage(code: string | undefined, dict: AuthDict): string | null {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return dict.invalid;
    case "PHONE_TAKEN":
      return dict.phoneTaken;
    case "INVALID_INPUT":
      return dict.invalidInput;
    default:
      return null;
  }
}

export function AuthCard({ mode, locale, dict }: { mode: Mode; locale: Locale; dict: AuthDict }) {
  const isLogin = mode === "login";
  const action = isLogin ? loginAction : registerAction;
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});
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
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-5 py-10 sm:px-10 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <Link href={localePath(locale)} className="inline-flex">
            <Logo />
          </Link>

          <h1 className="mt-10 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {isLogin ? dict.loginTitle : dict.registerTitle}
          </h1>
          <p className="mt-2 text-sm text-muted">{isLogin ? dict.loginSubtitle : dict.registerSubtitle}</p>

          {isLogin && (
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
          )}

          <form ref={formRef} action={formAction} className="mt-6 space-y-4">
            <input type="hidden" name="locale" value={locale} />
            {!isLogin && <Field label={dict.name} name="name" type="text" placeholder="Akmal Karimov" />}
            <Field label={dict.phone} name="phone" type="tel" placeholder="+998 90 123 45 67" inputRef={phoneRef} />
            <Field label={dict.password} name="password" type="password" placeholder="••••••••" inputRef={passwordRef} />
            {!isLogin && <Field label={dict.confirmPassword} name="confirmPassword" type="password" placeholder="••••••••" />}

            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <SubmitButton label={isLogin ? dict.loginButton : dict.registerButton} />
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {isLogin ? dict.noAccount : dict.haveAccount}{" "}
            <Link
              href={localePath(locale, isLogin ? "/register" : "/login")}
              className="font-semibold text-brand-700 hover:underline"
            >
              {isLogin ? dict.signUp : dict.signIn}
            </Link>
          </p>

          <Link
            href={localePath(locale)}
            className="mt-8 flex items-center justify-center gap-1.5 text-sm text-muted hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {dict.backHome}
          </Link>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 lg:block lg:w-1/2">
        <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div className="pointer-events-none absolute -right-20 top-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="relative flex h-full flex-col justify-center px-12 text-white">
          <Logo className="[&_span]:text-white" withText={false} />
          <p className="mt-6 text-3xl font-extrabold leading-tight">
            Track every debt.<br />Get paid on time.
          </p>
          <p className="mt-4 max-w-sm text-brand-100">
            Join 5,000+ businesses replacing paper notebooks with Paynote.
          </p>

          <div className="mt-10 max-w-sm rounded-card border border-white/20 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm text-brand-100">Total outstanding</p>
            <p className="text-2xl font-extrabold">₸ 5 410 000</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-2/3 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "..." : label}
    </button>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  inputRef,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input
        ref={inputRef}
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
