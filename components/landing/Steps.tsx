type StepsDict = {
  title: string;
  subtitle: string;
  items: { title: string; text: string }[];
};

const icons = [
  <path key="d" d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  <g key="r">
    <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M5 19c1.5-3.2 4-4.5 7-4.5s5.5 1.3 7 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </g>,
  <g key="a">
    <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 9h8M8 12.5h8M8 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </g>,
  <g key="m">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </g>,
];

export function Steps({ dict }: { dict: StepsDict }) {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>01 — 04</Eyebrow>
        <h2 className="mt-4 font-display text-[2.1rem] font-semibold tracking-tight text-ledger sm:text-[2.6rem]">
          {dict.title}
        </h2>
        <p className="mt-3 text-lg text-ledger-soft">{dict.subtitle}</p>
      </div>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {dict.items.map((step, i) => (
          <div
            key={step.title}
            className="group relative overflow-hidden rounded-2xl border border-rule bg-paper-2 p-6 transition hover:-translate-y-1 hover:shadow-ledger"
          >
            <span className="absolute right-4 top-3 font-display text-6xl font-semibold italic text-paper-3 transition group-hover:text-gold-soft">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-leaf-50 text-leaf ring-1 ring-leaf/15">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">{icons[i]}</svg>
            </span>
            <h3 className="relative mt-5 font-display text-xl font-semibold text-ledger">{step.title}</h3>
            <p className="relative mt-2 text-sm leading-relaxed text-ledger-soft">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-gold">
      <span className="h-px w-6 bg-gold/50" />
      {children}
      <span className="h-px w-6 bg-gold/50" />
    </span>
  );
}
