import type { CalendarEvent } from '../../services/calendarService'
import { categoryBadgeClasses, priorityBadgeClasses } from '../../services/calendarService'

interface EventCardProps {
  event: CalendarEvent
  compact?: boolean
}

export default function EventCard({ event, compact = false }: EventCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">{event.title}</h3>
          <p className="mt-1 text-sm text-slate-400">{event.time || 'Time not specified'}</p>
        </div>
        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeClasses[event.priority]}`}>
          {event.priority}
        </span>
      </div>

      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${categoryBadgeClasses[event.category]}`}>
            {event.category}
          </span>
          <span className="inline-flex rounded-full border border-white/10 bg-slate-950 px-3 py-1 text-xs text-slate-400">
            {event.isManual ? 'Manual' : 'Extracted'}
          </span>
        </div>
      )}
    </article>
  )
}
