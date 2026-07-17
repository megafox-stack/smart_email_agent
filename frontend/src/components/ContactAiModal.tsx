import { useEffect, useState, useRef } from 'react'
import api from '../services/api'
import { getContactInsights, saveContactInsights } from '../services/contactService'
import type { Contact } from '../types/contact'

export default function ContactAiModal({
  open,
  contact,
  onClose,
}: {
  open: boolean
  contact: Contact | null
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    let mounted = true
    if (!open || !contact) {
      setInsights('')
      return
    }

    setLoading(true)
    getContactInsights(contact.id)
      .then((text) => {
        if (!mounted) return
        setInsights(text ?? '')
      })
      .catch(() => {
        if (!mounted) return
        setInsights('')
      })
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [open, contact])

  if (!open || !contact) return null

  async function handleSave() {
    setSaving(true)
    try {
      if (!contact) return
      await saveContactInsights(contact.id, insights)
      window.dispatchEvent(new CustomEvent('contacts:updated'))
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'AI insights saved', type: 'success' } }))
      onClose()
    } catch (err) {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Failed to save insights', type: 'error' } }))
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerate() {
    if (!contact) return
    setGenerating(true)
    try {
      const resp = await api.post(`/api/contacts/${contact.id}/generate-insights`)
      const data = resp.data
      setInsights(data.ai_insights || '')
      window.dispatchEvent(new CustomEvent('contacts:updated'))
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'AI insights generated', type: 'success' } }))
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 503) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'AI service unavailable — start Ollama and try again', type: 'error' } }))
      } else {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: err?.message || 'Failed to generate insights', type: 'error' } }))
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">AI Insights — {contact.name}</h3>
          <button onClick={onClose} className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-1 text-sm text-slate-200">Close</button>
        </div>

        <div className="mt-4">
          <textarea
            ref={textareaRef}
            value={insights}
            onChange={(e) => setInsights(e.target.value)}
            rows={8}
            disabled={loading || generating || saving}
            onMouseEnter={(e) => {
              // ensure hover does not focus the textarea (prevents blinking caret in Chrome)
              try {
                const t = textareaRef.current
                if (t && document.activeElement === t) t.blur()
              } catch {}
            }}
            onClick={(e) => {
              try {
                const t = textareaRef.current
                if (t && !t.disabled) t.focus()
              } catch {}
            }}
            className={`w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 text-sm text-slate-100 ${
              loading || generating || saving ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          />
          {loading && <div className="mt-2 text-sm text-slate-400">Loading insights…</div>}
        </div>

        <div className="mt-4 flex justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={handleGenerate} disabled={generating || loading || saving} className="rounded-3xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-200">{generating ? 'Generating…' : 'Generate Insights'}</button>
            <button onClick={() => setInsights('')} disabled={loading || generating || saving} className="rounded-3xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-200">Clear</button>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-3xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-200">Cancel</button>
            <button onClick={handleSave} disabled={saving || loading || generating} className="rounded-3xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
