import { useEffect, useMemo, useState } from 'react'
import type { EmailDetail } from '../types/email'
import { analyzeEmailPhishing, type PhishingResult } from '../services/phishingService'

interface PhishingDetectionCardProps {
  emailDetail: EmailDetail | null
}

function getRiskColor(score: number) {
  if (score <= 25) return 'bg-emerald-500 text-emerald-100'
  if (score <= 50) return 'bg-amber-500 text-amber-950'
  if (score <= 75) return 'bg-orange-500 text-orange-950'
  return 'bg-red-500 text-red-100'
}

function getRiskLabel(score: number) {
  if (score <= 25) return 'Safe'
  if (score <= 50) return 'Low Risk'
  if (score <= 75) return 'Medium Risk'
  return 'High Risk'
}

export default function PhishingDetectionCard({ emailDetail }: PhishingDetectionCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PhishingResult | null>(null)

  useEffect(() => {
    let mounted = true

    async function runAnalysis() {
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
        const data = await analyzeEmailPhishing(emailDetail.id, {
          sender: emailDetail.sender,
          subject: emailDetail.subject,
          body: emailDetail.body ?? '',
        })

        if (!mounted) return
        setResult(data)

      } catch (err: any) {

        if (!mounted) return
        setError('Unable to analyze this email. Please try again later.')

      } finally {

        if (!mounted) return
        setLoading(false)

      }
    }

    runAnalysis()

    return () => {
      mounted = false
    }
  }, [emailDetail])

  const riskLabel = useMemo(() => {
    if (!result) return 'Unknown'
    return getRiskLabel(result.riskScore)
  }, [result])

  const riskColor = useMemo(() => {
    if (!result) return 'bg-slate-700 text-slate-200'
    return getRiskColor(result.riskScore)
  }, [result])

  if (!emailDetail) return null

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-sm">

      <div className="flex items-center gap-2">
        <span className="text-xl">🛡️</span>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
          Security Analysis
        </p>
      </div>

      {loading ? (

        <div className="mt-4 rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/90 p-4 text-sm text-slate-400">
          Analyzing email security...
        </div>

      ) : error ? (

        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-200">
          Unable to analyze this email.
          <br />
          Please try again later.
        </div>

      ) : result ? (

        <div className="mt-4 space-y-4">

          {/* Risk Score */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4">
            <p className="text-sm text-slate-400">Risk Score</p>
            <p className="mt-1 text-3xl font-semibold text-white">
              {result.riskScore}%
            </p>
          </div>

          {/* Classification + Status */}
          <div className="grid gap-3 md:grid-cols-2">

            <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4">
              <p className="text-sm text-slate-400">Classification</p>

              <p className="mt-2 text-lg font-semibold text-white">
                {result.classification}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4">
              <p className="text-sm text-slate-400">Status</p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${riskColor}`}
              >
                {result.safe ? 'Safe' : 'Unsafe'}
              </span>
            </div>

          </div>

          {/* Reasons */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4">

            <p className="text-sm text-slate-400">
              Reasons
            </p>

            <ul className="mt-3 space-y-2 text-sm text-slate-100">

              {result.reasons.length > 0 ? (

                result.reasons.map((reason, index) => (

                  <li
                    key={index}
                    className="list-inside list-disc"
                  >
                    {reason}
                  </li>

                ))

              ) : (

                <li>No specific reasons were reported.</li>

              )}

            </ul>

          </div>

          {/* AI Verdict */}
          {result.aiAnalysis && (

            <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4">

              <p className="text-sm text-slate-400">
                🤖 AI Verdict
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-100">
                {result.aiAnalysis}
              </p>

            </div>

          )}

          {/* Links Found */}
          {result.links && result.links.length > 0 && (

            <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4">

              <p className="text-sm text-slate-400">
                🔗 Links Found ({result.links.length})
              </p>

              <div className="mt-3 space-y-2">

                {result.links.map((link, index) => (

                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all rounded-xl bg-slate-900 px-3 py-2 text-sm text-blue-400 transition hover:bg-slate-800 hover:underline"
                  >
                    {link}
                  </a>

                ))}

              </div>

            </div>

          )}

        </div>

      ) : (

        <div className="mt-4 text-sm text-slate-400">
          Analyzing email security...
        </div>

      )}

    </div>
  )
}