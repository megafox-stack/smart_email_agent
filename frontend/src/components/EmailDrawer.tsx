import type { Email, EmailDetail } from '../types/email'
import { useEffect, useState } from 'react'
import { useEmailDetail } from '../hooks/useEmailDetail'
import ReplyComposer from './ReplyComposer'
import EmailSummary from './EmailSummary'
import PhishingDetectionCard from './PhishingDetectionCard'
import DeadlineCard from './DeadlineCard'

function isHtmlContent(value: string): boolean {
  return /<!doctype\s+html|<html[\s>]|<body[\s>]|<(div|table|p|br|a|img|span)\b/i.test(value)
}

function EmailBody({ body }: { body: string }) {
  if (isHtmlContent(body)) {
    return (
      <div className="mt-4 overflow-hidden rounded-xl bg-white">
        <iframe
          title="Email message"
          srcDoc={body}
          sandbox=""
          className="h-[500px] w-full border-0 bg-white"
        />
      </div>
    )
  }

  return (
    <div className="mt-4 max-h-[500px] overflow-auto rounded-xl bg-slate-950 p-4">
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
        {body}
      </p>
    </div>
  )
}

interface EmailDrawerProps {
  email: Email | null
  onClose: () => void
}

export default function EmailDrawer({ email, onClose }: EmailDrawerProps) {
  const [showComposer, setShowComposer] = useState(false)
  const { email: detail, loading, error, refresh } = useEmailDetail(email?.id ?? null)

  useEffect(() => {
    // Auto-open composer if URL hash requests it
    if (!email) {
      setShowComposer(false)
      return
    }

    if (window.location.hash === '#compose') {
      setShowComposer(true)
      if (!detail) refresh()
    }
  }, [email, detail, refresh])

  return (
    <aside className="fixed inset-y-0 right-0 z-30 w-full max-w-md overflow-y-auto border-l border-white/10 bg-slate-950/95 p-6 shadow-soft backdrop-blur-xl sm:relative sm:top-0 sm:right-0 sm:mt-0">
      <div className="flex items-center justify-between gap-4 pb-5">
        <div>
          <p className="text-sm text-slate-400">Email details</p>
          <h2 className="text-xl font-semibold text-white">Message info</h2>
        </div>
        <button
          type="button"
          onClick={() => { window.location.hash = ''; onClose() }}
          className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-700 hover:text-white"
        >
          Close
        </button>
      </div>

      {!email ? (
        <div className="rounded-3xl border border-dashed border-slate-700/90 bg-slate-900/80 p-8 text-sm text-slate-400">
          Select an email to see the detailed content.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Subject</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">{email.subject}</h3>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-sm">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">From</p>
              <p className="mt-2 text-lg font-semibold text-white">{email.sender}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Date</p>
              <p className="mt-2 text-lg text-slate-100">{email.date}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Message ID</p>
              <p className="mt-2 break-all text-sm text-slate-300">{email.id}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Message body</p>
            {loading ? (
              <div className="mt-2 text-sm text-slate-400">
                Loading body…
              </div>
            ) : error ? (
              <div className="mt-2 text-sm text-red-300">
                {error}
              </div>
            ) : (
              <EmailBody
                body={(detail as EmailDetail | null)?.body ?? ''}
              />
            )}
          </div>

          {/* Email summary component - appears below the message body */}
          <EmailSummary emailDetail={detail as EmailDetail | null} />
          <div className="h-px bg-white/10" />
          <PhishingDetectionCard emailDetail={detail as EmailDetail | null} />
          <div className="h-px bg-white/10" />
          <DeadlineCard emailDetail={detail as EmailDetail | null} />

          <div className="flex justify-end">
            <button
              onClick={() => {
                const next = !showComposer
                setShowComposer(next)
                if (next && !detail) refresh()
                // reflect composer state in URL so users can share/open directly
                window.location.hash = next ? '#compose' : ''
              }}
              className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
            >
              {showComposer ? 'Close composer' : 'Generate Reply'}
            </button>
          </div>

          {showComposer && detail && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-sm">
              <ReplyComposer original={detail} onClose={() => setShowComposer(false)} />
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
