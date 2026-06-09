"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Logo } from "@/components/Logo";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/lib/utils";

/** Shared split-screen layout for login / register / reset pages. */
export function AuthShell({
  locale,
  title,
  subtitle,
  backHome,
  children,
}: {
  locale: Locale;
  title: string;
  subtitle: string;
  backHome: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-5 py-10 sm:px-10 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <Link href={localePath(locale)} className="inline-flex">
            <Logo />
          </Link>

          <h1 className="mt-10 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>

          {children}

          <Link
            href={localePath(locale)}
            className="mt-8 flex items-center justify-center gap-1.5 text-sm text-muted hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {backHome}
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
            <p className="text-2xl font-extrabold">5 410 000 so&apos;m</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-2/3 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SubmitButton({ label }: { label: string }) {
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

export function Field({
  label,
  name,
  type,
  placeholder,
  inputRef,
  defaultValue,
  value,
  onChange,
  autoComplete,
  inputMode,
  maxLength,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  inputRef?: React.Ref<HTMLInputElement>;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "text";
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input
        ref={inputRef}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
