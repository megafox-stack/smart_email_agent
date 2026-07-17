import { useState } from 'react'
import api from '../services/api'
import type { EmailDetail } from '../types/email'

interface ReplyComposerProps {
  original: EmailDetail
  onClose: () => void
}

export default function ReplyComposer({ original, onClose }: ReplyComposerProps) {
  const [draft, setDraft] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Array<{ filename: string; contentType: string; data: string }>>([])

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/generate-reply', { email_id: original.id })
      setDraft(res.data.draft)
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to generate')
    } finally {
      setLoading(false)
    }
  }

  async function send() {
    setSending(true)
    setError(null)
    try {
      await api.post('/send-email', {
        to: original.sender,
        subject: `Re: ${original.subject}`,
        body: draft,
        threadId: original.threadId,
        attachments,
      })
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

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

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
        <p className="text-sm text-slate-400">Original message</p>
        <div className="mt-2 max-h-40 overflow-auto text-sm text-slate-100 whitespace-pre-wrap">{original.body}</div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={generate} className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white" disabled={loading}>
          {loading ? 'Generating…' : 'Generate Reply'}
        </button>
        <button onClick={() => { setDraft(''); setError(null) }} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-100">Clear</button>
        <button onClick={() => navigator.clipboard?.writeText(draft) } className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-100">Copy</button>
      </div>

      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-sm text-slate-100 min-h-[160px]" />

      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/60 p-4">
        <p className="text-sm text-slate-400">Attachments</p>
        <input
          type="file"
          multiple
          onChange={handleAttachmentChange}
          className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 file:mr-4 file:rounded-2xl file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
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
      </div>

      {error && <div className="text-sm text-red-300">{error}</div>}

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-100">Cancel</button>
        <button onClick={send} className="rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white" disabled={sending}>{sending ? 'Sending…' : 'Approve & Send'}</button>
      </div>
    </div>
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
