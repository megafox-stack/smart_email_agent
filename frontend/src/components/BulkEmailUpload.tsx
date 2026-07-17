import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Check, Loader2, Mail, Search, Send, Upload, X } from 'lucide-react'
import api from '../services/api'
import { fetchContacts, importContactsFromCsv } from '../services/contactService'
import { clearActivityLog, fetchActivityLog, sendBulkEmail, type ActivityLogEntry } from '../services/bulkEmailService'
import type { Contact } from '../types/contact'

const fieldClass =
  'mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'

function formatTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function parseEmailList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function ContactSelectModal({
  open,
  contacts,
  selectedIds,
  onClose,
  onToggle,
  onUseSelected,
}: {
  open: boolean
  contacts: Contact[]
  selectedIds: string[]
  onClose: () => void
  onToggle: (contactId: string) => void
  onUseSelected: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter((contact) => contact.name.toLowerCase().includes(q) || contact.email.toLowerCase().includes(q))
  }, [contacts, search])

  useEffect(() => {
    if (open) setSearch('')
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Select Contacts</h3>
            <p className="mt-1 text-sm text-slate-400">Pick recipients from your contacts list.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts by name or email..." className="w-full rounded-3xl border border-white/10 bg-slate-900 px-10 py-3 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" />
        </div>

        <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {filtered.map((contact) => {
            const checked = selectedIds.includes(contact.id)
            return (
              <label key={contact.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 transition hover:bg-slate-900">
                <input type="checkbox" checked={checked} onChange={() => onToggle(contact.id)} className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500/20" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{contact.name}</p>
                  <p className="truncate text-sm text-slate-400">{contact.email}</p>
                </div>
              </label>
            )
          })}
          {filtered.length === 0 && <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/50 p-6 text-sm text-slate-500">No contacts found.</div>}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-3xl border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800">Cancel</button>
          <button type="button" onClick={onUseSelected} className="rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-400">Use Selected Contacts</button>
        </div>
      </div>
    </div>
  )
}

export default function BulkEmailUpload() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectOpen, setSelectOpen] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [attachmentName, setAttachmentName] = useState<string | null>(null)
  const [sendLoading, setSendLoading] = useState(false)
  const [sendStatus, setSendStatus] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [activity, setActivity] = useState<ActivityLogEntry[]>([])

  useEffect(() => {
    void refreshContacts()
    void refreshActivity()
  }, [])

  async function refreshContacts() {
    setLoadingContacts(true)
    try { setContacts(await fetchContacts()) } finally { setLoadingContacts(false) }
  }

  async function refreshActivity() {
    try { setActivity(await fetchActivityLog()) } catch { /* keep quiet */ }
  }

  async function handleClearActivity() {
    const confirmed = window.confirm('Clear all activity log entries?')
    if (!confirmed) return

    try {
      await clearActivityLog()
      setActivity([])
      setSendStatus('Activity log cleared.')
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Unable to clear activity log.')
    }
  }

  const selectedContacts = useMemo(() => contacts.filter((contact) => selectedIds.includes(contact.id)), [contacts, selectedIds])
  const selectedPreview = selectedContacts.slice(0, 3)
  const extraCount = Math.max(0, selectedContacts.length - selectedPreview.length)

  function toggleSelected(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function handleCsvImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setSearchError(null)
      await importContactsFromCsv(file)
      await refreshContacts()
      setSendStatus('Contacts imported successfully.')
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Unable to import contacts.')
    } finally {
      event.target.value = ''
    }
  }

  async function handleExportContacts() {
    const response = await api.get('/api/contacts')
    const csv = ['id,name,email', ...(Array.isArray(response.data) ? response.data : []).map((c: Contact) => `${c.id},${c.name},${c.email}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'contacts.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSendError(null)
    setSendStatus(null)

    const recipients = selectedContacts.map((contact) => contact.email)
    if (recipients.length === 0) {
      setSendError('Select at least one contact.')
      return
    }
    if (!subject.trim()) {
      setSendError('Subject is required.')
      return
    }
    if (!body.trim()) {
      setSendError('Message body is required.')
      return
    }
    if (cc && parseEmailList(cc).length !== parseEmailList(cc).filter((email) => /[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).length) {
      setSendError('Please enter valid CC email addresses.')
      return
    }
    if (bcc && parseEmailList(bcc).length !== parseEmailList(bcc).filter((email) => /[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).length) {
      setSendError('Please enter valid BCC email addresses.')
      return
    }

    setSendLoading(true)
    try {
      const result = await sendBulkEmail({ subject: subject.trim(), body: body.trim(), recipients, cc: parseEmailList(cc), bcc: parseEmailList(bcc) })
      setSendStatus(`Sent ${result.sentCount} emails. ${result.failedCount} failed.`)
      await refreshActivity()
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Unable to send bulk email.')
    } finally {
      setSendLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Compose bulk email</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Bulk Email Automation Center</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">Send personalized emails to multiple contacts.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => setSelectOpen(true)} className="rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">+ Select Contacts</button>
          <label className="rounded-3xl border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800 cursor-pointer">
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
          </label>
          <button type="button" onClick={handleExportContacts} className="rounded-3xl border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800">Export Contacts</button>
        </div>

        {searchError && <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">{searchError}</div>}
        {loadingContacts && <div className="mt-4 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-4 text-sm text-sky-200">Loading contacts...</div>}

        <div className="mt-6 flex flex-wrap gap-2">
          {selectedPreview.map((contact) => (
            <span key={contact.id} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-100">
              {contact.name}
              <button type="button" onClick={() => toggleSelected(contact.id)} className="text-slate-400 hover:text-white">×</button>
            </span>
          ))}
          {extraCount > 0 && <span className="rounded-full border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-400">+{extraCount} More</span>}
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSend}>
          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={fieldClass} />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Message</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className={`${fieldClass} min-h-[220px] resize-y py-4`} />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-slate-300">
              <span className="text-slate-400">CC</span>
              <input value={cc} onChange={(e) => setCc(e.target.value)} className={fieldClass} />
            </label>
            <label className="block text-sm text-slate-300">
              <span className="text-slate-400">BCC</span>
              <input value={bcc} onChange={(e) => setBcc(e.target.value)} className={fieldClass} />
            </label>
          </div>

          <div>
            <span className="text-sm text-slate-400">Attachments</span>
            <label className="mt-2 flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 transition hover:border-slate-700">
              <input type="file" className="hidden" onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? null)} />
              <span className="truncate">{attachmentName || 'Optional attachment'}</span>
              <Upload className="h-4 w-4 shrink-0 text-slate-500" />
            </label>
          </div>

          {sendError && <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">{sendError}</div>}
          {sendStatus && <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">{sendStatus}</div>}

          <button type="submit" disabled={sendLoading} className="inline-flex items-center justify-center gap-2 rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700">
            {sendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sendLoading ? 'Sending...' : 'Send Bulk Email'}
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Activity Log</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Bulk Email Activity</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-500">Newest entries first</p>
            <button
              type="button"
              onClick={() => void refreshActivity()}
              className="rounded-3xl border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-400/40 hover:bg-sky-500/15"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void handleClearActivity()}
              className="rounded-3xl border border-white/10 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {activity.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/50 p-8 text-center text-sm text-slate-500">No bulk email activity yet.</div>
          ) : activity.map((entry) => (
            <article key={entry.id} className="rounded-3xl border border-white/10 bg-slate-900/75 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{entry.recipient}</p>
                  <p className="mt-1 truncate text-sm text-slate-400">{entry.subject}</p>
                  {entry.errorMessage && <p className="mt-2 text-xs text-rose-200">{entry.errorMessage}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${entry.status === 'Sent' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : entry.status === 'Failed' ? 'border-rose-500/20 bg-rose-500/10 text-rose-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-300'}`}>{entry.status}</span>
                  <time className="text-sm text-slate-500">{formatTime(entry.timestamp)}</time>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ContactSelectModal
        open={selectOpen}
        contacts={contacts}
        selectedIds={selectedIds}
        onClose={() => setSelectOpen(false)}
        onToggle={toggleSelected}
        onUseSelected={() => setSelectOpen(false)}
      />
    </div>
  )
}
