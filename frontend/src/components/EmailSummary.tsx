import { useEffect, useState } from 'react'
import type { EmailDetail } from '../types/email'
import {
  getSummaryForEmail,
  clearSummaryCache,
} from '../services/summarize'

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
        setLoading(true)

        const aiSummary = await getSummaryForEmail(id, {
          subject: subject || '',
          sender: sender || '',
          body: body || '',
        })

        if (!mounted) return

        setSummary(aiSummary || null)

      } catch (err: any) {

        if (!mounted) return

        setError(err?.message || 'Failed to generate AI summary.')

      } finally {

        if (!mounted) return

        setLoading(false)

      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [emailDetail])

  // ==========================
  // Regenerate AI Summary
  // ==========================

  const regenerateSummary = async () => {

    if (!emailDetail) return

    setLoading(true)
    setError(null)

    try {

      clearSummaryCache(emailDetail.id)

      const aiSummary = await getSummaryForEmail(emailDetail.id, {
        subject: emailDetail.subject || '',
        sender: emailDetail.sender || '',
        body: emailDetail.body || '',
      })

      setSummary(aiSummary)

    } catch (err: any) {

      setError(err?.message || 'Failed to regenerate summary.')

    } finally {

      setLoading(false)

    }
  }

  if (!emailDetail) return null

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>

          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            AI Email Summary
          </p>
        </div>

        <button
          onClick={regenerateSummary}
          disabled={loading}
          className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
        >
          🔄 Regenerate
        </button>

      </div>

      {loading ? (

        <div className="mt-4 rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/90 p-4 text-sm text-slate-400">
          Generating AI summary...
        </div>

      ) : error ? (

        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
          {error}
        </div>

      ) : summary ? (

        <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/90 p-4">

          <p className="text-sm text-slate-400">
            Summary
          </p>

          <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-100">

            {summary.includes('\n') ? (

              <ul className="list-inside list-disc space-y-2">

                {summary
                  .split('\n')
                  .filter(line => line.trim())
                  .map((line, index) => (
                    <li key={index}>
                      {line.replace(/^[-•]\s*/, '')}
                    </li>
                  ))}

              </ul>

            ) : (

              <p>{summary}</p>

            )}

          </div>

        </div>

      ) : (

        <div className="mt-4 rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/90 p-4 text-sm text-slate-400">
          No summary available.
        </div>

      )}

    </div>
  )
}