import { useEffect, useMemo, useState } from 'react'
import type { EmailDetail } from '../types/email'
import { extractDeadlines, type DeadlineItem, type DeadlineResult } from '../services/deadlineService'

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
