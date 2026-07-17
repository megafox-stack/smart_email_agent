import { useEffect, useMemo, useState } from 'react'
import type { EmailDetail } from '../types/email'
import { extractDeadlines, type DeadlineItem, type DeadlineResult } from '../services/deadlineService'
import { saveCalendarEvent } from '../services/calendarService'

interface DeadlineCardProps {
  emailDetail: EmailDetail | null
}

function priorityBadge(priority: string) {
  const normalized = priority?.toLowerCase() || ''
  if (normalized === 'high') return 'bg-red-500 text-red-100'
  if (normalized === 'medium') return 'bg-orange-500 text-orange-950'
  return 'bg-emerald-500 text-emerald-100'
}

function remainingLabel(days: number) {
  if (days < 0) return 'Deadline Passed'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `${days} days remaining`
}

export default function DeadlineCard({ emailDetail }: DeadlineCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DeadlineResult | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadDeadlines() {
      if (!emailDetail) {
        setResult(null)
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setResult(null)

      try {
        const data = await extractDeadlines(emailDetail.id, {
          subject: emailDetail.subject,
          sender: emailDetail.sender,
          body: emailDetail.body ?? '',
        })
        if (!mounted) return
        setResult(data)
      } catch (err: any) {
        if (!mounted) return
        setError('Unable to extract deadlines. Please try again later.')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    loadDeadlines()
    return () => {
      mounted = false
    }
  }, [emailDetail])

  if (!emailDetail) return null

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-xl">📅</span>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Deadlines</p>
      </div>

      {loading ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/90 p-4 text-sm text-slate-400">
          Extracting deadlines...
        </div>
      ) : error ? (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
          Unable to extract deadlines.
          <br />
          Please try again later.
        </div>
      ) : result && result.deadlines.length > 0 ? (
        <div className="mt-4 space-y-4">
          {result.deadlines.map((deadline, index) => (
            <div key={index} className="rounded-3xl border border-white/10 bg-slate-950/90 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-lg font-semibold text-white">{deadline.title}</p>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${priorityBadge(deadline.priority)}`}>
                  {deadline.priority}
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Date</p>
                  <p className="mt-1 text-sm text-slate-100">{deadline.date}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Time</p>
                  <p className="mt-1 text-sm text-slate-100">{deadline.time}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Remaining</p>
                <p className={`mt-1 text-sm font-semibold ${deadline.remainingDays < 0 ? 'text-red-300' : 'text-slate-100'}`}>
                  {remainingLabel(deadline.remainingDays)}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={async () => {
                    try {
                      const formData = {
                        title: deadline.title,
                        date: deadline.date,
                        time: deadline.time || '',
                        category: 'Deadline',
                        description: `Extracted from email: ${emailDetail?.subject ?? ''}`,
                        priority: deadline.priority === 'High' ? 'High' : deadline.priority === 'Low' ? 'Low' : 'Medium',
                      }

                      await saveCalendarEvent(formData as any, undefined, {
                        sender: emailDetail?.sender ?? 'Unknown',
                        sourceEmailId: emailDetail?.id ?? undefined,
                        sourceEmailSubject: emailDetail?.subject ?? undefined,
                        sourceEmailDate: emailDetail?.date ?? undefined,
                        isManual: false,
                      })

                      // notify calendar to refresh
                      window.dispatchEvent(new CustomEvent('calendar:updated'))
                      // show success toast
                      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Event added to calendar', type: 'success' } }))
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.error('Failed to save calendar event', err)
                    }
                  }}
                  className="rounded-2xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-400"
                >
                  Add to Calendar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-400">
          No deadlines detected.
        </div>
      )}
    </div>
  )
}
