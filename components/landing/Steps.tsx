type StepsDict = {
  title: string;
  subtitle: string;
  items: { title: string; text: string }[];
};

const icons = [
  // download
  <path key="d" d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  // register
  <g key="r">
    <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M5 19c1.5-3.2 4-4.5 7-4.5s5.5 1.3 7 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </g>,
  // accounting
  <g key="a">
    <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 9h8M8 12.5h8M8 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </g>,
  // monitor
  <g key="m">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </g>,
];

export function Steps({ dict }: { dict: StepsDict }) {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{dict.title}</h2>
        <p className="mt-3 text-lg text-muted">{dict.subtitle}</p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dict.items.map((step, i) => (
          <div key={step.title} className="relative rounded-card border border-line bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-pop">
            <span className="absolute right-5 top-5 text-5xl font-black text-surface">{i + 1}</span>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">{icons[i]}</svg>
            </span>
            <h3 className="mt-4 text-lg font-bold text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
