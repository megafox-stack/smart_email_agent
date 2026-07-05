import type { CalendarEvent } from '../../services/calendarService'
import { categoryBadgeClasses, formatDateKey } from '../../services/calendarService'

interface CalendarGridProps {
  monthDate: Date
  events: CalendarEvent[]
  selectedDate: string
  onSelectDate: (dateKey: string) => void
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarGrid({ monthDate, events, selectedDate, onSelectDate }: CalendarGridProps) {
  const todayKey = formatDateKey(new Date())
  const days = getCalendarDays(monthDate)
  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((groups, event) => {
    groups[event.date] = [...(groups[event.date] || []), event]
    return groups
  }, {})

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-soft">
      <div className="grid grid-cols-7 border-b border-white/10 bg-slate-900/80">
        {weekDays.map((day) => (
          <div key={day} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateKey = formatDateKey(day)
          const dayEvents = eventsByDate[dateKey] || []
          const inCurrentMonth = day.getMonth() === monthDate.getMonth()
          const isToday = dateKey === todayKey
          const isSelected = dateKey === selectedDate

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={`min-h-24 border-b border-r border-white/10 p-2 text-left transition last:border-r-0 sm:min-h-32 ${
                inCurrentMonth ? 'bg-slate-950/70 text-slate-100 hover:bg-slate-900/90' : 'bg-slate-950/30 text-slate-600'
              } ${isSelected ? 'ring-2 ring-inset ring-sky-400/70' : ''}`}
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl text-sm font-semibold ${
                  isToday ? 'bg-sky-500 text-white' : 'text-inherit'
                }`}
              >
                {day.getDate()}
              </span>

              {dayEvents.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span
                      key={event.id}
                      className={`h-2 w-2 rounded-full border ${categoryBadgeClasses[event.category]}`}
                      title={event.title}
                    />
                  ))}
                  {dayEvents.length > 3 && <span className="text-[11px] text-slate-500">+{dayEvents.length - 3}</span>}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function getCalendarDays(monthDate: Date): Date[] {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const start = new Date(firstOfMonth)
  start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}
