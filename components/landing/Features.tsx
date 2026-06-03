import { Eyebrow } from "./Steps";

type FeaturesDict = {
  title: string;
  subtitle: string;
  items: { title: string; text: string }[];
};

const icons = [
  <path key="0" d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />,
  <g key="1">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </g>,
  <g key="2">
    <path d="M5 8h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="m5 9 7 5 7-5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </g>,
  <g key="3">
    <rect x="3.5" y="9" width="6" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="14.5" y="4" width="6" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
  </g>,
  <g key="4">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M9.5 10.5c0-1.2 1-2 2.5-2s2.5.8 2.5 2-1 1.6-2.5 2-2.5.8-2.5 2 1 2 2.5 2 2.5-.8 2.5-2M12 7v1.5M12 15.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </g>,
  <g key="5">
    <path d="M4 19V5m0 14h16M8 16V9m4 7v-4m4 4V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </g>,
];

export function Features({ dict }: { dict: FeaturesDict }) {
  return (
    <section id="features" className="relative scroll-mt-24 border-y border-rule bg-paper-2 py-24">
      <div className="pointer-events-none absolute inset-0 bg-ledger-dots opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Imkoniyatlar</Eyebrow>
          <h2 className="mt-4 font-display text-[2.1rem] font-semibold tracking-tight text-ledger sm:text-[2.6rem]">
            {dict.title}
          </h2>
          <p className="mt-3 text-lg text-ledger-soft">{dict.subtitle}</p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {dict.items.map((f, i) => (
            <div key={f.title} className="group relative bg-paper p-7 transition hover:bg-paper-2">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-leaf to-leaf-600 text-paper shadow-[0_8px_18px_-8px_rgba(28,107,74,0.8)] transition group-hover:scale-105">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">{icons[i % icons.length]}</svg>
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-ledger">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ledger-soft">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
