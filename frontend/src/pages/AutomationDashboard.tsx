export default function AutomationDashboardPage() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-soft">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Automation dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Rule-based automation center</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          This view is now the control point for automation workflows without changing the existing inbox or Gmail integration.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Overview</p>
          <p className="mt-3 text-sm text-slate-300">Monitor workflow activity, priorities, and automation outcomes from a single place.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Status</p>
          <p className="mt-3 text-sm text-slate-300">The existing Gmail fetch and inbox layout remain unchanged.</p>
        </div>
      </div>
    </section>
  )
}
