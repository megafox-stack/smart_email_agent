import EventDetails from './EventDetails'
import type { CalendarEvent } from '../../services/calendarService'

export default function EventModal({
  event,
  onClose,
  onEdit,
  onDelete,
  onViewEmail,
}: {
  event: CalendarEvent | null
  onClose: () => void
  onEdit: (e: CalendarEvent) => void
  onDelete: (id: string) => void
  onViewEmail: (e: CalendarEvent) => void
}) {
  if (!event) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl">
        <div className="rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-xl">
          <div className="flex justify-end">
            <button onClick={onClose} className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200">Close</button>
          </div>
          <EventDetails
            selectedDate={event.date}
            events={[event]}
            onViewEmail={onViewEmail}
            onEditEvent={onEdit}
            onDeleteEvent={onDelete}
          />
        </div>
      </div>
    </div>
  )
}
