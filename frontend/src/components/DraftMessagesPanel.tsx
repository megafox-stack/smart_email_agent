import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Copy, Edit3, MailPlus, Search, Send, Trash2 } from 'lucide-react'

type DraftStatus = 'Draft' | 'Ready to Send'
type DraftFilter = 'All' | 'Today' | 'This Week' | 'Ready to Send' | 'Recently Edited'
type DraftSort = 'Last Modified' | 'Date Created' | 'Subject (A-Z)'

interface DraftMessage {
  id: string
  subject: string
  recipients: string
  body: string
  createdAt: string
  modifiedAt: string
  status: DraftStatus
}

interface DraftFormState {
  subject: string
  recipients: string
  body: string
}

const storageKey = 'emailAutomationAgentDraftMessages'
const filters: DraftFilter[] = ['All', 'Today', 'This Week', 'Ready to Send', 'Recently Edited']
const sortOptions: DraftSort[] = ['Last Modified', 'Date Created', 'Subject (A-Z)']

const emptyForm: DraftFormState = {
  subject: '',
  recipients: '',
  body: '',
}

export default function DraftMessagesPanel() {
  const [drafts, setDrafts] = useState<DraftMessage[]>(() => loadDrafts())
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<DraftFilter>('All')
  const [sortBy, setSortBy] = useState<DraftSort>('Last Modified')
  const [editingDraft, setEditingDraft] = useState<DraftMessage | null>(null)
  const [formData, setFormData] = useState<DraftFormState>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(drafts))
  }, [drafts])

  const filteredDrafts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return drafts
      .filter((draft) => {
        const matchesSearch =
          !normalizedSearch ||
          draft.subject.toLowerCase().includes(normalizedSearch) ||
          draft.recipients.toLowerCase().includes(normalizedSearch) ||
          draft.body.toLowerCase().includes(normalizedSearch)

        return matchesSearch && matchesFilter(draft, activeFilter)
      })
      .sort((first, second) => sortDrafts(first, second, sortBy))
  }, [activeFilter, drafts, searchTerm, sortBy])

  const stats = useMemo(() => {
    const today = new Date()
    return {
      total: drafts.length,
      recentlyModified: drafts.filter((draft) => isWithinDays(draft.modifiedAt, 7)).length,
      readyToSend: drafts.filter((draft) => draft.status === 'Ready to Send').length,
      createdToday: drafts.filter((draft) => isSameDay(draft.createdAt, today)).length,
    }
  }, [drafts])

  function openCreateForm() {
    setEditingDraft(null)
    setFormData(emptyForm)
    setShowForm(true)
    setStatusMessage(null)
  }

  function openEditForm(draft: DraftMessage) {
    setEditingDraft(draft)
    setFormData({
      subject: draft.subject,
      recipients: draft.recipients,
      body: draft.body,
    })
    setShowForm(true)
    setStatusMessage(null)
  }

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const now = new Date().toISOString()
    const nextStatus = getDraftStatus(formData)

    if (editingDraft) {
      setDrafts((current) =>
        current.map((draft) =>
          draft.id === editingDraft.id
            ? {
                ...draft,
                subject: formData.subject.trim() || 'Untitled draft',
                recipients: formData.recipients.trim(),
                body: formData.body.trim(),
                modifiedAt: now,
                status: nextStatus,
              }
            : draft,
        ),
      )
      setStatusMessage('Draft updated.')
    } else {
      setDrafts((current) => [
        {
          id: `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          subject: formData.subject.trim() || 'Untitled draft',
          recipients: formData.recipients.trim(),
          body: formData.body.trim(),
          createdAt: now,
          modifiedAt: now,
          status: nextStatus,
        },
        ...current,
      ])
      setStatusMessage('Draft created.')
    }

    setShowForm(false)
    setEditingDraft(null)
    setFormData(emptyForm)
  }

  function deleteDraft(draftId: string) {
    setDrafts((current) => current.filter((draft) => draft.id !== draftId))
    setStatusMessage('Draft deleted.')
  }

  function duplicateDraft(draft: DraftMessage) {
    const now = new Date().toISOString()
    setDrafts((current) => [
      {
        ...draft,
        id: `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        subject: `${draft.subject} Copy`,
        createdAt: now,
        modifiedAt: now,
      },
      ...current,
    ])
    setStatusMessage('Draft duplicated.')
  }

  function sendDraft(draft: DraftMessage) {
    if (draft.status !== 'Ready to Send') {
      setStatusMessage('Complete the subject, recipient, and message before sending.')
      return
    }

    setDrafts((current) => current.filter((item) => item.id !== draft.id))
    setStatusMessage('Draft marked as sent and removed from drafts.')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-sky-400/80">Draft Messages</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Draft Management</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-400">
              Review, search, edit, duplicate, and manage saved email drafts before sending.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            <MailPlus className="h-4 w-4" aria-hidden="true" />
            Create New Draft
          </button>
        </div>
        {statusMessage && (
          <div className="mt-5 rounded-3xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
            {statusMessage}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Drafts" value={stats.total} />
        <StatCard label="Recently Modified" value={stats.recentlyModified} />
        <StatCard label="Ready to Send" value={stats.readyToSend} />
        <StatCard label="Drafts Created Today" value={stats.createdToday} />
      </section>

      {showForm && (
        <DraftForm
          formData={formData}
          editing={Boolean(editingDraft)}
          onChange={setFormData}
          onCancel={() => {
            setShowForm(false)
            setEditingDraft(null)
            setFormData(emptyForm)
          }}
          onSubmit={saveDraft}
        />
      )}

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 shadow-soft">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,_1fr)_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by subject, recipient, or message preview"
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as DraftSort)}
            className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            aria-label="Sort drafts"
          >
            {sortOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                activeFilter === filter
                  ? 'bg-sky-500 text-white'
                  : 'border border-white/10 bg-slate-900 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
        {filteredDrafts.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/50 p-8 text-center">
            <p className="text-lg font-semibold text-slate-100">No draft messages available.</p>
            <button
              type="button"
              onClick={openCreateForm}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              <MailPlus className="h-4 w-4" aria-hidden="true" />
              Create New Draft
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onEdit={openEditForm}
                onDelete={deleteDraft}
                onDuplicate={duplicateDraft}
                onSend={sendDraft}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function DraftForm({
  formData,
  editing,
  onChange,
  onCancel,
  onSubmit,
}: {
  formData: DraftFormState
  editing: boolean
  onChange: (formData: DraftFormState) => void
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft" onSubmit={onSubmit}>
      <div className="mb-5">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{editing ? 'Edit draft' : 'New draft'}</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{editing ? 'Update Draft' : 'Create New Draft'}</h2>
      </div>

      <div className="grid gap-4">
        <label className="block text-sm text-slate-300">
          <span className="text-slate-400">Subject</span>
          <input
            type="text"
            value={formData.subject}
            onChange={(event) => onChange({ ...formData, subject: event.target.value })}
            placeholder="Project update"
            className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>
        <label className="block text-sm text-slate-300">
          <span className="text-slate-400">Recipient(s)</span>
          <input
            type="text"
            value={formData.recipients}
            onChange={(event) => onChange({ ...formData, recipients: event.target.value })}
            placeholder="student@example.com"
            className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>
        <label className="block text-sm text-slate-300">
          <span className="text-slate-400">Message</span>
          <textarea
            value={formData.body}
            onChange={(event) => onChange({ ...formData, body: event.target.value })}
            rows={7}
            placeholder="Write your draft message..."
            className="mt-2 w-full rounded-[2rem] border border-slate-800 bg-slate-950 px-4 py-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-3xl border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function DraftCard({
  draft,
  onEdit,
  onDelete,
  onDuplicate,
  onSend,
}: {
  draft: DraftMessage
  onEdit: (draft: DraftMessage) => void
  onDelete: (draftId: string) => void
  onDuplicate: (draft: DraftMessage) => void
  onSend: (draft: DraftMessage) => void
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="truncate text-xl font-semibold text-white">{draft.subject}</h3>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                draft.status === 'Ready to Send'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
              }`}
            >
              {draft.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">To: {draft.recipients || 'No recipients yet'}</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{getPreview(draft.body)}</p>
          <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
            <span>Date Created: {formatDateTime(draft.createdAt)}</span>
            <span>Last Modified: {formatDateTime(draft.modifiedAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <ActionButton label="Open/Edit" icon={Edit3} onClick={() => onEdit(draft)} />
          <ActionButton label="Duplicate" icon={Copy} onClick={() => onDuplicate(draft)} />
          <ActionButton label="Send" icon={Send} onClick={() => onSend(draft)} />
          <ActionButton label="Delete" icon={Trash2} onClick={() => onDelete(draft.id)} danger />
        </div>
      </div>
    </article>
  )
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  danger = false,
}: {
  label: string
  icon: typeof Edit3
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
        danger
          ? 'border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
          : 'border-white/10 bg-slate-950 text-slate-200 hover:bg-slate-800'
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-soft">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}

function getDraftStatus(formData: DraftFormState): DraftStatus {
  return formData.subject.trim() && formData.recipients.trim() && formData.body.trim() ? 'Ready to Send' : 'Draft'
}

function getPreview(body: string): string {
  if (!body.trim()) {
    return 'No message preview available.'
  }

  return body.length > 100 ? `${body.slice(0, 100)}...` : body
}

function sortDrafts(first: DraftMessage, second: DraftMessage, sortBy: DraftSort): number {
  if (sortBy === 'Date Created') {
    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  }

  if (sortBy === 'Subject (A-Z)') {
    return first.subject.localeCompare(second.subject)
  }

  return new Date(second.modifiedAt).getTime() - new Date(first.modifiedAt).getTime()
}

function matchesFilter(draft: DraftMessage, filter: DraftFilter): boolean {
  const now = new Date()
  if (filter === 'Today') return isSameDay(draft.modifiedAt, now)
  if (filter === 'This Week') return isWithinDays(draft.modifiedAt, 7)
  if (filter === 'Ready to Send') return draft.status === 'Ready to Send'
  if (filter === 'Recently Edited') return isWithinDays(draft.modifiedAt, 3)
  return true
}

function isSameDay(value: string, date: Date): boolean {
  const item = new Date(value)
  return item.getFullYear() === date.getFullYear() && item.getMonth() === date.getMonth() && item.getDate() === date.getDate()
}

function isWithinDays(value: string, days: number): boolean {
  const diff = Date.now() - new Date(value).getTime()
  return diff >= 0 && diff <= days * 86_400_000
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function loadDrafts(): DraftMessage[] {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}
