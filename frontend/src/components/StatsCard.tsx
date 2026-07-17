interface StatsCardProps {
  label: string
  value: number
  accent?: string
}

export default function StatsCard({
  label,
  value,
  accent = "",
}: StatsCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_50px_rgba(2,6,23,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/30 hover:bg-white/[0.06] hover:shadow-[0_20px_60px_rgba(14,165,233,0.12)] ${accent}`}
    >
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-sky-500/10 blur-3xl transition group-hover:bg-sky-400/15" />

      <div className="relative flex min-h-[96px] flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
              {label}
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white lg:text-[2rem]">
              {value}
            </h2>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-sky-300 shadow-sm transition group-hover:border-sky-400/30 group-hover:text-sky-200">
            <span className="text-lg">•</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(74,222,128,0.12)]"></div>

          <span className="text-xs font-medium text-slate-400">
            Live
          </span>
        </div>
      </div>
    </div>
  )
}
