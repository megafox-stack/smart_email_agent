import { useEffect, useState, type FormEvent } from 'react'
import type { CalendarEvent, CalendarEventFormData } from '../../services/calendarService'
import { EVENT_CATEGORIES, EVENT_PRIORITIES } from '../../services/calendarService'

interface EventFormProps {
  selectedDate: string
  editingEvent: CalendarEvent | null
  onSave: (formData: CalendarEventFormData, eventId?: string) => void
  onCancel: () => void
}

const inputClass =
  'mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'

export default function EventForm({ selectedDate, editingEvent, onSave, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState<CalendarEventFormData>({
    title: '',
    date: selectedDate,
    time: '',
    category: 'Reminder',
    description: '',
    priority: 'Medium',
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        date: editingEvent.date,
        time: editingEvent.time,
        category: editingEvent.category,
        description: editingEvent.description,
        priority: editingEvent.priority,
      })
      return
    }

    setFormData({
      title: '',
      date: selectedDate,
      time: '',
      category: 'Reminder',
      description: '',
      priority: 'Medium',
    })
  }, [editingEvent, selectedDate])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('Event title is required.')
      return
    }

    if (!formData.date) {
      setError('Date is required.')
      return
    }

    onSave(formData, editingEvent?.id)
  }

  return (
    <form className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft" onSubmit={handleSubmit}>
      <div className="mb-5">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Manual event</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
      </div>

      <div className="grid gap-4">
        <label className="block text-sm text-slate-300">
          <span className="text-slate-400">Event Title</span>
          <input
            type="text"
            value={formData.title}
            onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
            placeholder="Workshop Reminder"
            className={inputClass}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Date</span>
            <input
              type="date"
              value={formData.date}
              onChange={(event) => setFormData((current) => ({ ...current, date: event.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Time</span>
            <input
              type="time"
              value={formData.time}
              onChange={(event) => setFormData((current) => ({ ...current, time: event.target.value }))}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Category</span>
            <select
              value={formData.category}
              onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value as CalendarEventFormData['category'] }))}
              className={inputClass}
            >
              {EVENT_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Priority</span>
            <select
              value={formData.priority}
              onChange={(event) => setFormData((current) => ({ ...current, priority: event.target.value as CalendarEventFormData['priority'] }))}
              className={inputClass}
            >
              {EVENT_PRIORITIES.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm text-slate-300">
          <span className="text-slate-400">Description</span>
          <textarea
            value={formData.description}
            onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
            rows={4}
            placeholder="Add details for this event..."
            className={`${inputClass} resize-y py-4`}
          />
        </label>

        {error && (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          Save Event
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-3xl border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
