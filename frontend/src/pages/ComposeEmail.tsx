import { useState, type FormEvent } from 'react'
import api from '../services/api'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseEmailList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function validateEmailList(value: string): string | null {
  const list = parseEmailList(value)
  if (list.length === 0) {
    return null
  }
  const invalid = list.filter((email) => !emailRegex.test(email))
  return invalid.length > 0 ? `Invalid email(s): ${invalid.join(', ')}` : null
}

export default function ComposeEmail() {
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<Array<{ filename: string; contentType: string; data: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleAttachmentChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    const nextAttachments = await Promise.all(
      files.map(async (file) => ({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        data: await fileToBase64(file),
      })),
    )
    setAttachments((current) => [...current, ...nextAttachments])
    event.target.value = ''
  }

  function removeAttachment(filename: string) {
    setAttachments((current) => current.filter((attachment) => attachment.filename !== filename))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!to.trim()) {
      setError('Recipient email is required.')
      return
    }
    if (!subject.trim()) {
      setError('Subject is required.')
      return
    }
    if (!body.trim()) {
      setError('Message body is required.')
      return
    }

    const toError = validateEmailList(to)
    const ccError = validateEmailList(cc)
    const bccError = validateEmailList(bcc)

    if (toError || ccError || bccError) {
      setError([toError, ccError, bccError].filter(Boolean).join(' '))
      return
    }

    const payload = {
      to: parseEmailList(to).join(', '),
      cc: parseEmailList(cc),
      bcc: parseEmailList(bcc),
      subject: subject.trim(),
      body: body.trim(),
      attachments,
    }

    try {
      setLoading(true)
      await api.post('/send-email', payload)
      setSuccess('Email sent successfully.')
      setTo('')
      setCc('')
      setBcc('')
      setSubject('')
      setBody('')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to send email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-soft">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Compose email</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Write a new message</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Add recipients, subject, and body. Use CC/BCC as needed. Validate emails before sending.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">To</span>
            <input
              type="text"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="recipient@example.com"
              className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
            <p className="mt-2 text-xs text-slate-500">Separate multiple addresses with commas or semicolons.</p>
          </label>

          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">CC</span>
            <input
              type="text"
              value={cc}
              onChange={(event) => setCc(event.target.value)}
              placeholder="cc@example.com"
              className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">BCC</span>
            <input
              type="text"
              value={bcc}
              onChange={(event) => setBcc(event.target.value)}
              placeholder="bcc@example.com"
              className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject"
              className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Message body</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={10}
              placeholder="Write your message here..."
              className="mt-2 w-full rounded-[2rem] border border-slate-800 bg-slate-900/90 px-4 py-4 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Attachments</span>
            <input
              type="file"
              multiple
              onChange={handleAttachmentChange}
              className="mt-2 w-full rounded-3xl border border-dashed border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-2xl file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-sky-500"
            />
            {attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <span key={attachment.filename} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs text-slate-200">
                    {attachment.filename}
                    <button type="button" onClick={() => removeAttachment(attachment.filename)} className="text-slate-400 hover:text-white">×</button>
                  </span>
                ))}
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
            {success}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">All fields marked are validated before sending.</p>
          <button
            type="submit"
            disabled={loading}
            className="rounded-3xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {loading ? 'Sending…' : 'Send email'}
          </button>
        </div>
      </form>
    </section>
  )
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buffer)
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}
