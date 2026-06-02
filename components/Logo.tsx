import { cn } from "@/lib/utils";

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <path
            d="M6 3.5h9.5a3 3 0 0 1 3 3V20a.5.5 0 0 1-.5.5H7a2.5 2.5 0 0 1-2.5-2.5V6A2.5 2.5 0 0 1 7 3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M9 8.5h6M9 12h6M9 15.5h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      {withText && (
        <span className="text-lg font-bold tracking-tight text-ink">
          cash.<span className="text-brand-600">identify</span><span className="text-muted">.uz</span>
        </span>
      )}
    </span>
  );
}
