import { useEffect, useState } from 'react'
import type { EmailDetail } from '../types/email'
import { getSummaryForEmail } from '../services/summarize'

interface EmailSummaryProps {
  emailDetail: EmailDetail | null
}

export default function EmailSummary({ emailDetail }: EmailSummaryProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setError(null)
      setSummary(null)
      if (!emailDetail) return
      const { id, subject, sender, body } = emailDetail
      try {
        // if we already have a cached summary it will be returned immediately by the service
        setLoading(true)
        const s = await getSummaryForEmail(id, { subject: subject || '', sender: sender || '', body: body || '' })
        if (!mounted) return
        setSummary(s || null)
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message || 'Failed to generate summary')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [emailDetail])

  if (!emailDetail) return null

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-sm">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Summary</p>

      {loading ? (
        <div className="mt-3 text-sm text-slate-400">Generating summary…</div>
      ) : error ? (
        <div className="mt-3 text-sm text-red-300">{error}</div>
      ) : summary ? (
        <div className="mt-3 text-sm text-slate-100">
          {/* Render as bullets when multiple lines present, otherwise a paragraph */}
          {summary.includes('\n') ? (
            <ul className="list-inside list-disc space-y-1">
              {summary.split('\n').map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          ) : (
            <p>{summary}</p>
          )}
        </div>
      ) : (
        <div className="mt-3 text-sm text-slate-400">No summary available.</div>
      )}
    </div>
  )
}
