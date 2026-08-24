import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("relative border border-white/6 bg-ink-900/70 backdrop-blur-sm", className)}>{children}</div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "px-3 pb-1.5 pt-3 font-mono text-[9.5px] font-medium uppercase tracking-[0.22em] text-muted/80",
        className
      )}
    >
      {children}
    </div>
  );
}

export function IconBtn({
  active,
  onClick,
  title,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md border transition-all duration-200",
        active
          ? "border-gold/45 bg-gold/15 text-gold shadow-[0_0_16px_-4px_rgba(227,176,98,0.7)]"
          : "border-white/8 bg-white/[0.02] text-muted hover:border-white/18 hover:bg-white/[0.06] hover:text-parchment",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="group block select-none">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-parchment-dim">
          {label}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-gold/85">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded-full outline-none
          [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold
          [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(227,176,98,0.85)] [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-125
          [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-gold"
        style={{
          background: `linear-gradient(90deg, rgba(227,176,98,0.85) ${pct}%, rgba(255,255,255,0.09) ${pct}%)`,
        }}
      />
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04]"
    >
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] text-parchment-dim transition-colors group-hover:text-parchment">
          {label}
        </span>
        {hint && <span className="block truncate font-mono text-[9.5px] tracking-wide text-muted/70">{hint}</span>}
      </span>
      <span
        className={cn(
          "relative h-[15px] w-[26px] shrink-0 rounded-full border transition-all duration-300",
          checked ? "border-gold/60 bg-gold/30" : "border-white/12 bg-white/[0.04]"
        )}
      >
        <span
          className={cn(
            "absolute top-[1.5px] h-[10px] w-[10px] rounded-full transition-all duration-300",
            checked ? "left-[13px] bg-gold shadow-[0_0_8px_rgba(227,176,98,0.9)]" : "left-[2px] bg-muted"
          )}
        />
      </span>
    </button>
  );
}

export function Chip({
  color,
  label,
  onClick,
  active,
  dim,
}: {
  color?: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
  dim?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-[10.5px] font-medium transition-all duration-200",
        active === false
          ? "border-white/8 bg-transparent text-muted/60 hover:text-parchment-dim"
          : "border-white/10 bg-white/[0.04] text-parchment-dim hover:border-white/20 hover:text-parchment",
        dim && "opacity-40"
      )}
    >
      {color && (
        <span
          className="h-1.5 w-1.5 rounded-full transition-all"
          style={{ background: color, boxShadow: active === false ? "none" : `0 0 8px ${color}` }}
        />
      )}
      {label}
    </button>
  );
}

export function AlchemyMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="0.9" opacity="0.35" />
      <path d="M16 4.5 27 24H5L16 4.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M16 27.5 5 8h22L16 27.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" opacity="0.75" />
      <circle cx="16" cy="16" r="3.4" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="16" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}
