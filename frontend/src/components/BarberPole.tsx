interface BarberPoleProps {
  /** Height in px of the striped glass part */
  height?: number;
  /** Width in px */
  width?: number;
  animated?: boolean;
  className?: string;
}

/**
 * The classic red–white–blue barber pole – the universal symbol of barbershops.
 * Pure CSS, animated stripes, no images needed.
 */
export default function BarberPole({ height = 120, width = 36, animated = true, className = '' }: BarberPoleProps) {
  const capHeight = Math.max(8, Math.round(width * 0.38));
  return (
    <div className={`inline-flex flex-col items-center ${className}`} style={{ width: width + 10 }} aria-hidden="true">
      <div className="h-2 w-2 rounded-full bg-slate-300" />
      <div className="w-full rounded-t-full bg-gradient-to-b from-slate-200 to-slate-400 shadow" style={{ height: capHeight }} />
      <div
        className="relative overflow-hidden rounded-sm ring-2 ring-slate-300/80"
        style={{ width, height, boxShadow: 'inset -6px 0 12px rgba(0,0,0,0.35), inset 6px 0 10px rgba(255,255,255,0.35)' }}
      >
        <div className={`absolute inset-0 ${animated ? 'barber-stripes-animated' : 'barber-stripes'}`} />
        <div className="absolute inset-y-0 left-1 w-1.5 rounded-full bg-white/40 blur-[1px]" />
      </div>
      <div className="w-full rounded-b-full bg-gradient-to-b from-slate-400 to-slate-200 shadow" style={{ height: capHeight }} />
      <div className="h-2 w-2 rounded-full bg-slate-300" />
    </div>
  );
}
