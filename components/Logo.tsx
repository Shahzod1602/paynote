import { cn } from "@/lib/utils";

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-[0.7rem] bg-gradient-to-br from-leaf to-leaf-600 text-paper shadow-[0_6px_16px_-6px_rgba(28,107,74,0.7)]">
        {/* ledger book + coin */}
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <path
            d="M6 3.5h9.5a3 3 0 0 1 3 3V20a.5.5 0 0 1-.5.5H7a2.5 2.5 0 0 1-2.5-2.5V6A2.5 2.5 0 0 1 7 3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M9 8.5h6M9 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="13" cy="15.5" r="2.4" stroke="currentColor" strokeWidth="1.4" />
          <path d="M13 14.5v2M12.2 15.5h1.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-gold ring-2 ring-paper" />
      </span>
      {withText && (
        <span className="text-[1.35rem] font-bold leading-none tracking-tight text-ledger">
          Pay<span className="text-leaf">note</span>
        </span>
      )}
    </span>
  );
}
