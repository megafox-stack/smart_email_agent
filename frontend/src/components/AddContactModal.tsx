import { useEffect, useState } from 'react'

interface Props {
  open: boolean
  initial?: { name: string; email: string } | null
  onClose: () => void
  onSave: (payload: { name: string; email: string }) => Promise<void> | void
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AddContactModal({ open, initial, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setEmail(initial?.email ?? '')
      setError(null)
      setSaving(false)
    }
  }, [open, initial])

  if (!open) return null

  async function handleSave() {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName || !trimmedEmail) {
      setError('Both fields are required.')
      return
    }

    if (!emailRegex.test(trimmedEmail)) {
      setError('Email must be valid.')
      return
    }

    setError(null)
    setSaving(true)
    try {
      await onSave({ name: trimmedName, email: trimmedEmail })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-soft animate-[fadeIn_180ms_ease-out]">
        <div className="mb-5">
          <h3 className="text-xl font-semibold text-white">{initial ? 'Edit Contact' : 'Add Contact'}</h3>
          <p className="mt-1 text-sm text-slate-400">Save a contact for faster email communication.</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-3xl border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {saving ? 'Saving…' : 'Save Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}
