import api from './api'
import { extractDeadlines } from './deadlineService'
import type { Email, EmailDetail } from '../types/email'

export type EventCategory =
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
  { label: 'Assignments', category: 'Assignment' },
  { label: 'Exams', category: 'Exam' },
  { label: 'Meetings', category: 'Meeting' },
  { label: 'Workshops', category: 'Workshop' },
  { label: 'Finance', category: 'Finance' },
  { label: 'Placements', category: 'Placement' },
  { label: 'Personal', category: 'Personal' },
] as const

const categoryRules: Array<{ category: EventCategory; keywords: string[] }> = [
  { category: 'Assignment', keywords: ['assignment', 'deadline', 'due', 'submit before', 'submission'] },
  { category: 'Exam', keywords: ['exam', 'test', 'quiz', 'assessment'] },
  { category: 'Workshop', keywords: ['workshop', 'bootcamp', 'training'] },
  { category: 'Meeting', keywords: ['meeting', 'call', 'discussion', 'project review', 'review'] },
  { category: 'Seminar', keywords: ['seminar', 'webinar', 'viva', 'presentation'] },
  { category: 'Finance', keywords: ['fee', 'payment', 'invoice', 'pay before', 'dues'] },
  { category: 'Placement', keywords: ['placement', 'internship', 'interview', 'drive', 'application deadline'] },
  { category: 'Reminder', keywords: ['reminder', 'remember', 'scheduled'] },
]

const eventKeywords = categoryRules.flatMap((rule) => rule.keywords)

export const categoryBadgeClasses: Record<EventCategory, string> = {
  Assignment: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
  Exam: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
  Meeting: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  Workshop: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  Seminar: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  Finance: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  Placement: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/20',
  Personal: 'bg-teal-500/15 text-teal-300 border-teal-500/20',
  Reminder: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  Other: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
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
    category: formData.category,
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
  return rule?.category || 'Other'
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
