"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type FaqDict = {
  title: string;
  subtitle: string;
  items: { q: string; a: string }[];
};

export function Faq({ dict }: { dict: FaqDict }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 bg-surface/60 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{dict.title}</h2>
          <p className="mt-3 text-lg text-muted">{dict.subtitle}</p>
        </div>

        <div className="mt-10 space-y-3">
          {dict.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="overflow-hidden rounded-2xl border border-line bg-white">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-ink">{item.q}</span>
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-brand-600 transition-transform",
                      isOpen && "rotate-45 border-brand-300 bg-brand-50"
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
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{item.a}</p>
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
