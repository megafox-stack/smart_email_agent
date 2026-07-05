import { AlertCircle, CalendarDays, CheckCircle2, ClipboardList, GraduationCap, Users } from 'lucide-react'
import type { CalendarEvent } from '../../services/calendarService'
import { getDaysRemaining } from '../../services/calendarService'

interface EventStatisticsProps {
  events: CalendarEvent[]
}

export default function EventStatistics({ events }: EventStatisticsProps) {
  const stats = [
    {
      label: 'Total Events',
      value: events.length,
      icon: CalendarDays,
      accent: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
    },
    {
      label: 'Upcoming Events',
      value: events.filter((event) => getDaysRemaining(event.date) >= 0).length,
      icon: CheckCircle2,
      accent: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    },
    {
      label: 'Overdue Events',
      value: events.filter((event) => getDaysRemaining(event.date) < 0).length,
      icon: AlertCircle,
      accent: 'border-red-500/20 bg-red-500/10 text-red-300',
    },
    {
      label: 'Assignments',
      value: events.filter((event) => event.category === 'Assignment').length,
      icon: ClipboardList,
      accent: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
    },
    {
      label: 'Meetings',
      value: events.filter((event) => event.category === 'Meeting').length,
      icon: Users,
      accent: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
    },
    {
      label: 'Exams',
      value: events.filter((event) => event.category === 'Exam').length,
      icon: GraduationCap,
      accent: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {stats.map(({ label, value, icon: Icon, accent }) => (
        <div key={label} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
            </div>
            <div className={`rounded-2xl border p-3 ${accent}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
