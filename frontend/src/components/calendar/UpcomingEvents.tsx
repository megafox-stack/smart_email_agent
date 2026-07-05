import type { CalendarEvent } from '../../services/calendarService'
import { getDaysRemaining, priorityBadgeClasses } from '../../services/calendarService'

interface UpcomingEventsProps {
  events: CalendarEvent[]
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  const upcoming = events
    .map((event) => ({ event, remaining: getDaysRemaining(event.date) }))
    .filter((item) => item.remaining >= 0)
    .sort((first, second) => first.remaining - second.remaining)
    .slice(0, 5)

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
      <div className="mb-5">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Next five</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Upcoming Events</h2>
      </div>

      {upcoming.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/50 p-6 text-sm text-slate-500">
          No events available.
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(({ event, remaining }) => (
            <article key={event.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">{event.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{event.date}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatRemaining(remaining)}</p>
                </div>
                <span className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeClasses[event.priority]}`}>
                  {event.priority}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function formatRemaining(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return '1 day remaining'
  return `${days} days remaining`
}
