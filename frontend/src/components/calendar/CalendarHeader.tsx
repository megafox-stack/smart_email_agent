import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarHeaderProps {
  monthDate: Date
  onPreviousMonth: () => void
  onNextMonth: () => void
}

export default function CalendarHeader({ monthDate, onPreviousMonth, onNextMonth }: CalendarHeaderProps) {
  const label = monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Monthly calendar</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{label}</h2>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPreviousMonth}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-200 transition hover:bg-slate-800"
          aria-label="Previous Month"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onNextMonth}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-200 transition hover:bg-slate-800"
          aria-label="Next Month"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
