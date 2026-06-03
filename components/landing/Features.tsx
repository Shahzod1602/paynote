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
    <section id="features" className="scroll-mt-20 bg-surface/60 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{dict.title}</h2>
          <p className="mt-3 text-lg text-muted">{dict.subtitle}</p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dict.items.map((f, i) => (
            <div key={f.title} className="group rounded-card border border-line bg-white p-6 shadow-soft transition hover:border-brand-200 hover:shadow-pop">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft transition group-hover:scale-105">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">{icons[i % icons.length]}</svg>
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
