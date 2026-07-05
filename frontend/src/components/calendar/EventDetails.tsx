import { Edit3, MailOpen, Trash2 } from 'lucide-react'
import type { CalendarEvent } from '../../services/calendarService'
import { categoryBadgeClasses, priorityBadgeClasses } from '../../services/calendarService'
import EventCard from './EventCard'

interface EventDetailsProps {
  selectedDate: string
  events: CalendarEvent[]
  onViewEmail: (event: CalendarEvent) => void
  onEditEvent: (event: CalendarEvent) => void
  onDeleteEvent: (eventId: string) => void
}

export default function EventDetails({
  selectedDate,
  events,
  onViewEmail,
  onEditEvent,
  onDeleteEvent,
}: EventDetailsProps) {
  return (
    <aside className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
      <div className="mb-5">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Selected date</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{selectedDate}</h2>
      </div>

      {events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/50 p-6 text-sm text-slate-500">
          No events available.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-3xl border border-white/10 bg-slate-900/60 p-4">
              <EventCard event={event} compact />

              <div className="mt-4 grid gap-3 text-sm">
                <Detail label="Date" value={event.date} />
                <Detail label="Time" value={event.time || 'Time not specified'} />
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${categoryBadgeClasses[event.category]}`}>
                    {event.category}
                  </span>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeClasses[event.priority]}`}>
                    {event.priority}
                  </span>
                </div>
                <Detail label="Sender" value={event.sender || 'Manual entry'} />
                <Detail label="Source Email Subject" value={event.sourceEmailSubject || 'Manual event'} />
                {event.description && <Detail label="Description" value={event.description} />}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onViewEmail(event)}
                  disabled={!event.sourceEmailId}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MailOpen className="h-4 w-4" aria-hidden="true" />
                  View Email
                </button>
                <button
                  type="button"
                  onClick={() => onEditEvent(event)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  <Edit3 className="h-4 w-4" aria-hidden="true" />
                  Edit Event
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteEvent(event.id)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete Event
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-slate-200">{value}</p>
    </div>
  )
}
