interface StatsCardProps {
  label: string
  value: number
  accent: string
}

export default function StatsCard({ label, value, accent }: StatsCardProps) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-soft ${accent}`}>
      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <h2 className="mt-4 text-3xl font-semibold text-white">{value}</h2>
      <p className="mt-2 text-sm text-slate-400">Updated just now</p>
    </div>
  )
}
