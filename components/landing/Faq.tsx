"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Steps";

type FaqDict = {
  title: string;
  subtitle: string;
  items: { q: string; a: string }[];
};

export function Faq({ dict }: { dict: FaqDict }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 border-y border-rule bg-paper-2 py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Savol-javob</Eyebrow>
          <h2 className="mt-4 font-display text-[2.1rem] font-semibold tracking-tight text-ledger sm:text-[2.6rem]">
            {dict.title}
          </h2>
          <p className="mt-3 text-lg text-ledger-soft">{dict.subtitle}</p>
        </div>

        <div className="mt-12 divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-paper">
          {dict.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-paper-2/60"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-lg font-semibold text-ledger">{item.q}</span>
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-rule text-leaf transition-transform",
                      isOpen && "rotate-45 border-leaf/40 bg-leaf-50"
                    )}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-[0.95rem] leading-relaxed text-ledger-soft">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
