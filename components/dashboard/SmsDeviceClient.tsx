"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  startPairingAction,
  getDeviceStatusAction,
  setDefaultViaAction,
  type DeviceStatusResult,
} from "@/lib/actions/sms-device";

type Dict = {
  smsTitle: string;
  smsSubtitle: string;
  connectPhone: string;
  reconnect: string;
  connecting: string;
  scanQr: string;
  orEnterCode: string;
  phoneConnected: string;
  online: string;
  offline: string;
  notConnected: string;
  defaultMethod: string;
  viaOwn: string;
  viaGateway: string;
  viaOwnDisabled: string;
  gatewayOnline: string;
  gatewayOffline: string;
  downloadApp: string;
  appHint: string;
  saved: string;
  error: string;
};

type Status = Extract<DeviceStatusResult, { ok: true }>;

export function SmsDeviceClient({
  initial,
  dict,
  appUrl,
}: {
  initial: Status | null;
  dict: Dict;
  appUrl?: string;
}) {
  const [status, setStatus] = useState<Status | null>(initial);
  const [via, setVia] = useState<string>(initial?.via ?? "gateway");
  const [pairing, setPairing] = useState<{ qr: string; code: string; expiresAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const res = await getDeviceStatusAction();
    if (res.ok) {
      setStatus(res);
      setVia(res.via);
      // Telefon ulanib bo'lsa pairing oynasini yopamiz.
      if (res.ownConnected) setPairing(null);
      return res;
    }
    return null;
  }, []);

  // Mount'da joriy holatni yuklaymiz (akkaunt birinchi marta shu yerda provision bo'ladi).
  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    (async () => {
      const res = await getDeviceStatusAction();
      if (cancelled || !res.ok) return;
      setStatus(res);
      setVia(res.via);
      if (res.ownConnected) setPairing(null);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pairing ochiq bo'lsa har 3 soniyada holatni tekshiramiz.
  useEffect(() => {
    if (!pairing) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(refresh, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pairing, refresh]);

  function connect() {
    setError(null);
    startTransition(async () => {
      const res = await startPairingAction();
      if (res.ok) {
        setPairing({ qr: res.qr, code: res.code, expiresAt: res.expiresAt });
      } else {
        setError(dict.error);
      }
    });
  }

  function chooseVia(next: "own" | "gateway") {
    setVia(next);
    startTransition(async () => {
      const res = await setDefaultViaAction(next);
      if (res.ok) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
      }
    });
  }

  const connected = status?.ownConnected;

  return (
    <div className="mt-4 space-y-4">
      {/* Telefon holati */}
      <div className="rounded-xl border border-line bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" className={`h-8 w-8 ${connected ? "text-brand-600" : "text-muted"}`}>
              <path
                d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm5 17h.01"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              {connected ? (
                <>
                  <p className="font-semibold text-ink">
                    {status?.devices[0]?.name || dict.phoneConnected}
                  </p>
                  <p className="text-xs text-muted">
                    {status?.ownOnline ? (
                      <span className="text-green-600">● {dict.online}</span>
                    ) : (
                      <span>○ {dict.offline}</span>
                    )}
                    {status?.devices[0]?.battery != null && ` · ${status.devices[0].battery}%`}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-ink">{dict.notConnected}</p>
                  <p className="text-xs text-muted">{dict.smsSubtitle}</p>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={connect}
            disabled={isPending}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {isPending && !pairing ? dict.connecting : connected ? dict.reconnect : dict.connectPhone}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {/* Ilovani yuklab olish — har doim ko'rinadi (oson topilsin) */}
        {appUrl && !connected && (
          <a
            href={appUrl}
            download
            className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-brand-300 bg-brand-50 p-3 transition hover:bg-brand-100"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>
              <span className="block text-sm font-semibold text-brand-700">{dict.downloadApp}</span>
              <span className="block text-xs text-muted">{dict.appHint}</span>
            </span>
          </a>
        )}

        {/* QR + kod */}
        {pairing && (
          <div className="mt-4 flex flex-col items-center gap-2 border-t border-line pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pairing.qr} alt="QR" className="h-44 w-44 rounded-lg border border-line" />
            <p className="text-sm text-muted">{dict.scanQr}</p>
            <p className="text-sm text-muted">
              {dict.orEnterCode}:{" "}
              <span className="font-mono text-lg font-bold tracking-widest text-ink">{pairing.code}</span>
            </p>
          </div>
        )}
      </div>

      {/* Standart usul */}
      <div className="rounded-xl border border-line bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-ink">{dict.defaultMethod}</p>
          {savedFlash && <span className="text-xs font-semibold text-green-600">{dict.saved}</span>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => chooseVia("own")}
            disabled={!connected || isPending}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
              via === "own" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line bg-white text-ink hover:bg-gray-50"
            }`}
          >
            {dict.viaOwn}
          </button>
          <button
            type="button"
            onClick={() => chooseVia("gateway")}
            disabled={isPending}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
              via === "gateway" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line bg-white text-ink hover:bg-gray-50"
            }`}
          >
            {dict.viaGateway}
          </button>
        </div>
        {!connected && <p className="mt-2 text-xs text-muted">{dict.viaOwnDisabled}</p>}
        <p className="mt-2 text-xs text-muted">
          {status?.gatewayOnline ? (
            <span className="text-green-600">● {dict.gatewayOnline}</span>
          ) : (
            <span>○ {dict.gatewayOffline}</span>
          )}
        </p>
      </div>
    </div>
  );
}
