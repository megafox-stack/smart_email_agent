import api from './api'
import { extractDeadlines } from './deadlineService'
import type { Email, EmailDetail } from '../types/email'

export type EventCategory =
  | 'Meeting'
  | 'Deadline'
  | 'Interview'
  | 'Reminder'
  | 'Holiday'
  | 'Birthday'
  | 'Conference'
  | 'Personal'
  | 'Other'
  | 'Assignment'
  | 'Exam'
  | 'Meeting'
  | 'Workshop'
  | 'Seminar'
  | 'Finance'
  | 'Placement'
  | 'Personal'
  | 'Reminder'
  | 'Other'

export type EventPriority = 'High' | 'Medium' | 'Low'

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  category: EventCategory
  priority: EventPriority
  sender: string
  sourceEmailId?: string
  sourceEmailSubject: string
  sourceEmailDate?: string
  description: string
  isManual: boolean
}

export interface CalendarEventFormData {
  title: string
  date: string
  time: string
  category: EventCategory
  description: string
  priority: EventPriority
}

export const EVENT_CATEGORIES: EventCategory[] = [
  'Meeting',
  'Deadline',
  'Interview',
  'Reminder',
  'Holiday',
  'Birthday',
  'Conference',
  'Personal',
  'Other',
  'Assignment',
  'Exam',
  'Meeting',
  'Workshop',
  'Seminar',
  'Finance',
  'Placement',
  'Personal',
  'Reminder',
  'Other',
]

export const EVENT_PRIORITIES: EventPriority[] = ['High', 'Medium', 'Low']

export const EVENT_FILTERS = [
  { label: 'All Events', category: null },
  { label: 'Meetings', category: 'Meeting' },
  { label: 'Deadlines', category: 'Deadline' },
  { label: 'Interviews', category: 'Interview' },
  { label: 'Reminders', category: 'Reminder' },
  { label: 'Holidays', category: 'Holiday' },
  { label: 'Birthdays', category: 'Birthday' },
  { label: 'Conferences', category: 'Conference' },
  { label: 'Personal', category: 'Personal' },
] as const

const categoryRules: Array<{ category: EventCategory; keywords: string[] }> = [
  { category: 'Deadline', keywords: ['deadline', 'due', 'submit before', 'submission', 'expires'] },
  { category: 'Interview', keywords: ['interview', 'hr round', 'technical round', 'panel'] },
  { category: 'Meeting', keywords: ['meeting', 'call', 'discussion', 'project review', 'review'] },
  { category: 'Conference', keywords: ['conference', 'summit', 'symposium', 'webinar'] },
  { category: 'Reminder', keywords: ['reminder', 'remember', 'scheduled', 'alert'] },
  { category: 'Holiday', keywords: ['holiday', 'festival', 'vacation', 'break'] },
  { category: 'Birthday', keywords: ['birthday', 'bday', 'anniversary'] },
  { category: 'Personal', keywords: ['personal', 'family', 'party', 'appointment'] },
]

const eventKeywords = categoryRules.flatMap((rule) => rule.keywords)

export const categoryBadgeClasses: Record<EventCategory, string> = {
  Meeting: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  Deadline: 'bg-red-500/15 text-red-300 border-red-500/20',
  Interview: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  Reminder: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  Holiday: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  Birthday: 'bg-pink-500/15 text-pink-300 border-pink-500/20',
  Conference: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
  Personal: 'bg-teal-500/15 text-teal-300 border-teal-500/20',
  Other: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
  Assignment: 'bg-red-500/15 text-red-300 border-red-500/20',
  Exam: 'bg-red-500/15 text-red-300 border-red-500/20',
  Workshop: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  Seminar: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
  Finance: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  Placement: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
}

export const priorityBadgeClasses: Record<EventPriority, string> = {
  High: 'bg-red-500/15 text-red-300 border-red-500/20',
  Medium: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  Low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
}

interface EmailResponse {
  emails: Email[]
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getDaysRemaining(dateKey: string, fromDate = new Date()): number {
  const target = parseDateKey(dateKey)
  const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
  return Math.ceil((target.getTime() - start.getTime()) / 86_400_000)
}

export function createManualCalendarEvent(formData: CalendarEventFormData): CalendarEvent {
  return {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: formData.title.trim(),
    date: formData.date,
    time: formData.time.trim(),
    category: normalizeCategory(formData.category),
    priority: formData.priority,
    sender: 'Manual entry',
    sourceEmailSubject: 'Manual event',
    description: formData.description.trim(),
    isManual: true,
  }
}

export async function loadExtractedCalendarEvents(): Promise<CalendarEvent[]> {
  const response = await api.get<EmailResponse>('/emails')
  const emails = response.data.emails || []

  const detailResults = await Promise.all(
    emails.map(async (email) => {
      try {
        const detailResponse = await api.get<EmailDetail>(`/email/${email.id}`)
        return detailResponse.data
      } catch {
        return { ...email, body: '' } as EmailDetail
      }
    }),
  )

  const eventGroups = await Promise.all(detailResults.map(extractEventsFromEmail))
  return eventGroups.flat()
}

export async function loadCalendarEvents(): Promise<CalendarEvent[]> {
  const response = await api.get<CalendarEvent[]>('/api/calendar-events')
  return Array.isArray(response.data) ? response.data.map(normalizeEvent) : []
}

export async function saveCalendarEvent(
  formData: CalendarEventFormData,
  eventId?: string,
  meta?: Partial<{
    sender: string
    sourceEmailId: string
    sourceEmailSubject: string
    sourceEmailDate: string
    isManual: boolean
  }>,
): Promise<CalendarEvent> {
  const payload = {
    title: formData.title.trim(),
    date: formData.date,
    time: formData.time.trim(),
    category: normalizeCategory(formData.category),
    priority: formData.priority,
    sender: meta?.sender ?? 'Manual entry',
    sourceEmailId: meta?.sourceEmailId ?? null,
    sourceEmailSubject: meta?.sourceEmailSubject ?? 'Manual event',
    sourceEmailDate: meta?.sourceEmailDate ?? null,
    description: formData.description.trim(),
    isManual: meta?.isManual ?? true,
  }

  const response = eventId
    ? await api.put<CalendarEvent>(`/api/calendar-events/${eventId}`, payload)
    : await api.post<CalendarEvent>('/api/calendar-events', payload)

  return normalizeEvent(response.data)
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  await api.delete(`/api/calendar-events/${eventId}`)
}

async function extractEventsFromEmail(email: EmailDetail): Promise<CalendarEvent[]> {
  const text = `${email.subject || ''} ${email.body || ''}`.toLowerCase()
  const matchedKeyword = eventKeywords.find((keyword) => text.includes(keyword))

  if (!matchedKeyword) {
    return []
  }

  const result = await extractDeadlines(email.id, {
    subject: email.subject,
    sender: email.sender,
    body: email.body || '',
  })

  return result.deadlines
    .filter((deadline) => isValidDateKey(deadline.date))
    .map((deadline, index) => {
      const category = inferCategory(text)
      return {
        id: `email-${email.id}-${index}-${deadline.date}`,
        title: deadline.title || email.subject || 'Email event',
        date: deadline.date,
        time: deadline.time || '',
        category,
        priority: inferPriority(text, deadline.priority, deadline.remainingDays),
        sender: email.sender,
        sourceEmailId: email.id,
        sourceEmailSubject: email.subject,
        sourceEmailDate: email.date,
        description: `Extracted using rule keyword "${matchedKeyword}".`,
        isManual: false,
      }
    })
}

function inferCategory(text: string): EventCategory {
  const rule = categoryRules.find((item) => item.keywords.some((keyword) => text.includes(keyword)))
  return rule?.category || normalizeCategoryFromTitle(text)
}

function normalizeCategory(category: string): EventCategory {
  const normalized = category.toLowerCase()
  if (normalized.includes('meeting')) return 'Meeting'
  if (normalized.includes('deadline') || normalized.includes('due')) return 'Deadline'
  if (normalized.includes('interview')) return 'Interview'
  if (normalized.includes('reminder')) return 'Reminder'
  if (normalized.includes('holiday')) return 'Holiday'
  if (normalized.includes('birthday')) return 'Birthday'
  if (normalized.includes('conference')) return 'Conference'
  if (normalized.includes('personal')) return 'Personal'
  return 'Other'
}

function normalizeCategoryFromTitle(text: string): EventCategory {
  return normalizeCategory(text)
}

function normalizeEvent(event: CalendarEvent): CalendarEvent {
  return {
    ...event,
    category: normalizeCategory(event.category),
    time: event.time || '',
    sender: event.sender || 'Manual entry',
    sourceEmailSubject: event.sourceEmailSubject || 'Manual event',
    description: event.description || '',
  }
}

function inferPriority(text: string, fallbackPriority: string, remainingDays: number): EventPriority {
  if (text.includes('urgent') || text.includes('asap') || remainingDays <= 2) {
    return 'High'
  }

  if (fallbackPriority.toLowerCase() === 'low' || remainingDays > 14) {
    return 'Low'
  }

  return 'Medium'
}

function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const parsed = parseDateKey(value)
  return formatDateKey(parsed) === value
}
