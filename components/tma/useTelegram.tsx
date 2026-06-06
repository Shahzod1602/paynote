"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// ── Minimal typing for the slice of the Telegram WebApp API we use ──────────────
type ThemeParams = Record<string, string | undefined>;

type HapticKind = "light" | "medium" | "heavy" | "success" | "warning" | "error";

type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

type WebApp = {
  initData: string;
  initDataUnsafe?: { user?: TgUser };
  colorScheme?: "light" | "dark";
  themeParams?: ThemeParams;
  ready: () => void;
  expand: () => void;
  setBackgroundColor?: (c: string) => void;
  setHeaderColor?: (c: string) => void;
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
  close?: () => void;
  BackButton?: { show: () => void; hide: () => void; onClick: (cb: () => void) => void; offClick: (cb: () => void) => void };
  HapticFeedback?: {
    impactOccurred?: (s: string) => void;
    notificationOccurred?: (s: string) => void;
    selectionChanged?: () => void;
  };
  requestContact?: (cb: (ok: boolean, ev?: unknown) => void) => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: WebApp };
  }
}

// Telegram themeParams (snake_case) → our CSS variables, with light fallbacks.
const THEME_MAP: Record<string, string> = {
  bg_color: "--tg-bg",
  text_color: "--tg-text",
  hint_color: "--tg-hint",
  link_color: "--tg-link",
  button_color: "--tg-button",
  button_text_color: "--tg-button-text",
  secondary_bg_color: "--tg-secondary-bg",
  section_bg_color: "--tg-section-bg",
  section_separator_color: "--tg-separator",
  destructive_text_color: "--tg-destructive",
  subtitle_text_color: "--tg-subtitle",
};

function applyTheme(wa: WebApp) {
  const root = document.documentElement;
  const tp = wa.themeParams ?? {};
  for (const [k, cssVar] of Object.entries(THEME_MAP)) {
    const value = tp[k];
    if (value) root.style.setProperty(cssVar, value);
  }
  root.dataset.tgScheme = wa.colorScheme ?? "light";
}

/** Extracts the user object from a raw initData query-string (dev/browser fallback). */
function userFromInitData(initData: string): TgUser | null {
  try {
    const raw = new URLSearchParams(initData).get("user");
    return raw ? (JSON.parse(raw) as TgUser) : null;
  } catch {
    return null;
  }
}

type TmaContext = {
  ready: boolean;
  isTelegram: boolean;
  initData: string;
  user: TgUser | null;
  haptic: (kind?: HapticKind) => void;
  setBackButton: (visible: boolean, onClick?: () => void) => void;
  requestContact: () => Promise<string | null>;
  close: () => void;
};

const Ctx = createContext<TmaContext | null>(null);

export function useTelegram(): TmaContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTelegram must be used within <TmaProvider>");
  return ctx;
}

type TgState = { ready: boolean; isTelegram: boolean; initData: string; user: TgUser | null };

export function TmaProvider({ children }: { children: React.ReactNode }) {
  const [tg, setTg] = useState<TgState>({ ready: false, isTelegram: false, initData: "", user: null });
  const backCb = useRef<(() => void) | null>(null);

  useEffect(() => {
    const wa = window.Telegram?.WebApp;
    let cleanup: (() => void) | undefined;
    let next: TgState;
    if (wa && wa.initData) {
      wa.ready();
      wa.expand();
      applyTheme(wa);
      const onTheme = () => applyTheme(wa);
      wa.onEvent?.("themeChanged", onTheme);
      cleanup = () => wa.offEvent?.("themeChanged", onTheme);
      next = {
        ready: true,
        isTelegram: true,
        initData: wa.initData,
        user: wa.initDataUnsafe?.user ?? userFromInitData(wa.initData),
      };
    } else {
      // Browser / dev fallback: read forged initData from the URL (?initData=...).
      // Safe because the server still verifies the HMAC against the bot token.
      const fromUrl = new URLSearchParams(window.location.search).get("initData") ?? "";
      next = { ready: true, isTelegram: false, initData: fromUrl, user: fromUrl ? userFromInitData(fromUrl) : null };
    }
    // One-time initialization from the Telegram SDK (an external system) on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTg(next);
    return cleanup;
  }, []);

  const haptic = useCallback((kind: HapticKind = "light") => {
    const h = window.Telegram?.WebApp?.HapticFeedback;
    if (!h) return;
    if (kind === "success" || kind === "warning" || kind === "error") h.notificationOccurred?.(kind);
    else h.impactOccurred?.(kind);
  }, []);

  const setBackButton = useCallback((visible: boolean, onClick?: () => void) => {
    const bb = window.Telegram?.WebApp?.BackButton;
    if (!bb) return;
    if (backCb.current) bb.offClick(backCb.current);
    if (visible) {
      const cb = onClick ?? (() => {});
      backCb.current = cb;
      bb.onClick(cb);
      bb.show();
    } else {
      backCb.current = null;
      bb.hide();
    }
  }, []);

  const requestContact = useCallback((): Promise<string | null> => {
    const wa = window.Telegram?.WebApp;
    const fn = wa?.requestContact;
    if (!wa || !fn) return Promise.resolve(null);
    return new Promise((resolve) => {
      let settled = false;
      const done = (v: string | null) => {
        if (!settled) {
          settled = true;
          resolve(v);
        }
      };
      try {
        fn.call(wa, (ok, ev) => {
          if (!ok) return done(null);
          // Phone shape varies across client versions — probe the known paths.
          const e = ev as
            | { responseUnsafe?: { contact?: { phone_number?: string } }; response?: string }
            | undefined;
          let phone = e?.responseUnsafe?.contact?.phone_number ?? null;
          if (!phone && typeof e?.response === "string") {
            try {
              phone = new URLSearchParams(e.response).get("contact")
                ? JSON.parse(new URLSearchParams(e.response).get("contact")!)?.phone_number ?? null
                : null;
            } catch {
              phone = null;
            }
          }
          done(phone);
        });
      } catch {
        done(null);
      }
      // Safety timeout — if the client never calls back, don't hang the UI.
      setTimeout(() => done(null), 30_000);
    });
  }, []);

  const close = useCallback(() => window.Telegram?.WebApp?.close?.(), []);

  const value: TmaContext = {
    ready: tg.ready,
    isTelegram: tg.isTelegram,
    initData: tg.initData,
    user: tg.user,
    haptic,
    setBackButton,
    requestContact,
    close,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
