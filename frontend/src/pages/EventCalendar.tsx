import { useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw, Search } from 'lucide-react'
import CalendarGrid from '../components/calendar/CalendarGrid'
import CalendarHeader from '../components/calendar/CalendarHeader'
import EventDetails from '../components/calendar/EventDetails'
import EventForm from '../components/calendar/EventForm'
import EventStatistics from '../components/calendar/EventStatistics'
import UpcomingEvents from '../components/calendar/UpcomingEvents'
import EmailDrawer from '../components/EmailDrawer'
import type { Email } from '../types/email'
import {
  createManualCalendarEvent,
  EVENT_FILTERS,
  formatDateKey,
  loadExtractedCalendarEvents,
  loadCalendarEvents,
  saveCalendarEvent,
  deleteCalendarEvent,
  type CalendarEvent,
  type CalendarEventFormData,
} from '../services/calendarService'
import EventModal from '../components/calendar/EventModal'

type FilterLabel = (typeof EVENT_FILTERS)[number]['label']

export default function EventCalendar() {
  const todayKey = formatDateKey(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [monthDate, setMonthDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [selectedFilter, setSelectedFilter] = useState<FilterLabel>('All Events')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    function onCalendarUpdated() {
      void loadEvents()
    }

    window.addEventListener('calendar:updated', onCalendarUpdated as EventListener)
    return () => window.removeEventListener('calendar:updated', onCalendarUpdated as EventListener)
  }, [])

  const filteredEvents = useMemo(() => {
    const filter = EVENT_FILTERS.find((item) => item.label === selectedFilter)
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return events.filter((event) => {
      const matchesCategory = !filter?.category || event.category === filter.category
      const matchesSearch = !normalizedSearch || event.title.toLowerCase().includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })
  }, [events, searchTerm, selectedFilter])

  const selectedDateEvents = filteredEvents
    .filter((event) => event.date === selectedDate)
    .sort((first, second) => first.time.localeCompare(second.time))

  async function loadEvents() {
    setLoading(true)
    setError(null)

    try {
      const persistedEvents = await loadCalendarEvents()
      const extractedEvents = await loadExtractedCalendarEvents()
      // merge persisted and extracted, prefer persisted when ids collide
      const map = new Map<string, CalendarEvent>()
      ;[...persistedEvents, ...extractedEvents].forEach((ev) => map.set(ev.id, ev))
      setEvents(Array.from(map.values()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load calendar events.')
    } finally {
      setLoading(false)
    }
  }

  function goToPreviousMonth() {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
  }

  function handleSelectDate(dateKey: string) {
    setSelectedDate(dateKey)
    setShowForm(false)
    setEditingEvent(null)
  }

  function handleCreateEvent() {
    setEditingEvent(null)
    setShowForm(true)
  }

  function handleEditEvent(event: CalendarEvent) {
    setSelectedDate(event.date)
    setEditingEvent(event)
    setShowForm(true)
  }

  async function handleSaveEvent(formData: CalendarEventFormData, eventId?: string) {
    await saveCalendarEvent(formData, eventId)
    setShowForm(false)
    setEditingEvent(null)
    await loadEvents()
  }

  async function handleDeleteEvent(eventId: string) {
    await deleteCalendarEvent(eventId)
    setEvents((current) => current.filter((event) => event.id !== eventId))
    if (editingEvent?.id === eventId) {
      setEditingEvent(null)
      setShowForm(false)
    }
    if (selectedEvent?.id === eventId) setSelectedEvent(null)
  }

  function handleSelectEvent(event: CalendarEvent) {
    setSelectedEvent(event)
    setSelectedDate(event.date)
    setShowForm(false)
    setEditingEvent(null)
  }

  function handleViewEmail(event: CalendarEvent) {
    if (!event.sourceEmailId) {
      return
    }

    setSelectedEmail({
      id: event.sourceEmailId,
      subject: event.sourceEmailSubject,
      sender: event.sender,
      date: event.sourceEmailDate || event.date,
    })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-sky-400/80">Rule-Based Event Calendar</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Important Dates From Email</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-400">
              Events are extracted with deterministic keyword and date rules, plus manually managed entries.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadEvents}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              {loading ? 'Loading...' : 'Refresh Events'}
            </button>
            <button
              type="button"
              onClick={handleCreateEvent}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Event
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}
      </section>

      <EventStatistics events={events} />

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 shadow-soft">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,_1fr)_240px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search events by title"
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>

          <select
            value={selectedFilter}
            onChange={(event) => setSelectedFilter(event.target.value as FilterLabel)}
            className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            aria-label="Event filter"
          >
            {EVENT_FILTERS.map((filter) => (
              <option key={filter.label}>{filter.label}</option>
            ))}
          </select>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,_2fr)_minmax(360px,_1fr)] xl:items-start">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
            <CalendarHeader
              monthDate={monthDate}
              onPreviousMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
            />
            <div className="mt-5">
              <CalendarGrid
                monthDate={monthDate}
                events={filteredEvents}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            </div>
          </section>

          <UpcomingEvents events={filteredEvents} />
        </div>

        <div className="space-y-6">
          <EventDetails
            selectedDate={selectedDate}
            events={selectedDateEvents}
            onViewEmail={handleViewEmail}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />

          {showForm && (
            <EventForm
              selectedDate={selectedDate}
              editingEvent={editingEvent}
              onSave={handleSaveEvent}
              onCancel={() => {
                setShowForm(false)
                setEditingEvent(null)
              }}
            />
          )}
        </div>
      </div>

      {selectedEmail && (
        <div className="fixed inset-0 z-40 bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="mx-auto max-w-lg">
            <EmailDrawer email={selectedEmail} onClose={() => setSelectedEmail(null)} />
          </div>
        </div>
      )}

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(e) => { setEditingEvent(e); setShowForm(true); setSelectedEvent(null) }}
          onDelete={(id) => handleDeleteEvent(id)}
          onViewEmail={(e) => handleViewEmail(e)}
        />
      )}
    </div>
  )
}
