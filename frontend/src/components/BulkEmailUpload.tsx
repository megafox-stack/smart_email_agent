import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  MailCheck,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import api from '../services/api'
import type { BulkRecipient } from '../types/bulk'

type ActivityStatus = 'Sent' | 'Sending' | 'Pending' | 'Failed'
type StatusFilter = ActivityStatus | 'All'
type SortOrder = 'Newest First' | 'Oldest First'

interface BulkActivity {
  id: string
  batchId: string
  recipient: string
  status: ActivityStatus
  time: string
  subject: string
  createdAt: number
  detail?: string
}

interface ActivityDraft {
  recipient: string
  subject: string
  status: ActivityStatus
}

interface SummaryItem {
  label: string
  value: number
  icon: LucideIcon
  accentClass: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const fieldClass =
  'mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
const selectClass =
  'w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'

const statusClasses: Record<ActivityStatus, string> = {
  Sent: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  Sending: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
  Pending: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  Failed: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
}

const statusIcons: Record<ActivityStatus, LucideIcon> = {
  Sent: CheckCircle2,
  Sending: Loader2,
  Pending: Clock3,
  Failed: XCircle,
}

function parseEmailList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function validateEmailList(value: string): boolean {
  return parseEmailList(value).every((email) => emailRegex.test(email))
}

function formatActivityTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function SummaryCard({ label, value, icon: Icon, accentClass }: SummaryItem) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className={`rounded-2xl border p-3 ${accentClass}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

interface ComposePanelProps {
  recipients: BulkRecipient[]
  validCount: number
  invalidCount: number
  fileName: string | null
  attachmentName: string | null
  uploadError: string | null
  loading: boolean
  subject: string
  body: string
  cc: string
  bcc: string
  sendStatus: string | null
  sendError: string | null
  sendLoading: boolean
  recipientInputKey: number
  attachmentInputKey: number
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onAttachmentChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubjectChange: (value: string) => void
  onBodyChange: (value: string) => void
  onCcChange: (value: string) => void
  onBccChange: (value: string) => void
  onRemoveRecipient: (index: number) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClear: () => void
}

function ComposePanel({
  recipients,
  validCount,
  invalidCount,
  fileName,
  attachmentName,
  uploadError,
  loading,
  subject,
  body,
  cc,
  bcc,
  sendStatus,
  sendError,
  sendLoading,
  recipientInputKey,
  attachmentInputKey,
  onFileChange,
  onAttachmentChange,
  onSubjectChange,
  onBodyChange,
  onCcChange,
  onBccChange,
  onRemoveRecipient,
  onSubmit,
  onClear,
}: ComposePanelProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Compose bulk email</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Bulk Email Automation Center</h2>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <span className="text-sm text-slate-400">Recipient Selection</span>
          <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/80 px-5 py-6 text-center transition hover:border-slate-500">
            <input
              key={recipientInputKey}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onFileChange}
            />
            <Upload className="h-6 w-6 text-sky-300" aria-hidden="true" />
            <span className="mt-3 text-sm font-medium text-slate-200">
              {fileName || 'Upload recipient CSV'}
            </span>
            <span className="mt-1 text-xs text-slate-500">name,email</span>
          </label>
          {uploadError && (
            <div className="mt-3 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
              {uploadError}
            </div>
          )}
          {loading && (
            <div className="mt-3 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-4 text-sm text-sky-200">
              Parsing CSV and validating recipients...
            </div>
          )}
        </div>

        <label className="block text-sm text-slate-300">
          <span className="text-slate-400">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(event) => onSubjectChange(event.target.value)}
            placeholder="Project update, workshop reminder, etc."
            className={fieldClass}
          />
        </label>

        <label className="block text-sm text-slate-300">
          <span className="text-slate-400">Message</span>
          <textarea
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            rows={8}
            placeholder="Write your bulk email message here..."
            className={`${fieldClass} min-h-[220px] resize-y py-4`}
          />
        </label>

        <div>
          <span className="text-sm text-slate-400">Attachment Upload</span>
          <label className="mt-2 flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 transition hover:border-slate-700">
            <input
              key={attachmentInputKey}
              type="file"
              className="hidden"
              onChange={onAttachmentChange}
            />
            <span className="truncate">{attachmentName || 'Optional attachment'}</span>
            <Upload className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
          </label>
        </div>

        <details className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-300">Optional CC/BCC</summary>
          <div className="mt-4 grid gap-4">
            <label className="block text-sm text-slate-300">
              <span className="text-slate-400">CC</span>
              <input
                type="text"
                value={cc}
                onChange={(event) => onCcChange(event.target.value)}
                placeholder="cc@example.com"
                className={fieldClass}
              />
            </label>
            <label className="block text-sm text-slate-300">
              <span className="text-slate-400">BCC</span>
              <input
                type="text"
                value={bcc}
                onChange={(event) => onBccChange(event.target.value)}
                placeholder="bcc@example.com"
                className={fieldClass}
              />
            </label>
          </div>
        </details>

        {sendError && (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
            {sendError}
          </div>
        )}

        {sendStatus && (
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
            {sendStatus}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={sendLoading}
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {sendLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            {sendLoading ? 'Sending...' : 'Send Bulk Email'}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Clear Form
          </button>
        </div>
      </form>

      <SelectedRecipients
        recipients={recipients}
        validCount={validCount}
        invalidCount={invalidCount}
        onRemoveRecipient={onRemoveRecipient}
      />
    </section>
  )
}

interface SelectedRecipientsProps {
  recipients: BulkRecipient[]
  validCount: number
  invalidCount: number
  onRemoveRecipient: (index: number) => void
}

function SelectedRecipients({ recipients, validCount, invalidCount, onRemoveRecipient }: SelectedRecipientsProps) {
  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Selected Recipients</p>
          <p className="mt-2 text-2xl font-semibold text-white">{validCount} recipients selected</p>
        </div>
        {invalidCount > 0 && (
          <p className="text-sm text-rose-300">{invalidCount} invalid entries excluded</p>
        )}
      </div>

      {recipients.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/50 p-5 text-sm text-slate-500">
          No recipients selected.
        </div>
      ) : (
        <div className="mt-4 flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1">
          {recipients.map((recipient, index) => (
            <span
              key={`${recipient.email}-${index}`}
              className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-xs ${
                recipient.valid
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                  : 'border-rose-500/20 bg-rose-500/10 text-rose-200'
              }`}
              title={recipient.error || recipient.email}
            >
              <span className="truncate">{recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}</span>
              <button
                type="button"
                onClick={() => onRemoveRecipient(index)}
                className="rounded-full p-0.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label={`Remove ${recipient.email}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface ActivityPanelProps {
  activities: BulkActivity[]
  onAddActivity: (draft: ActivityDraft) => void
  onRemoveActivity: (activityId: string) => void
}

function ActivityPanel({ activities, onAddActivity, onRemoveActivity }: ActivityPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [sortOrder, setSortOrder] = useState<SortOrder>('Newest First')
  const [newRecipient, setNewRecipient] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newStatus, setNewStatus] = useState<ActivityStatus>('Pending')
  const [activityFormError, setActivityFormError] = useState<string | null>(null)

  const filteredActivities = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return activities
      .filter((activity) => {
        const matchesSearch = normalizedSearch.length === 0 || activity.recipient.toLowerCase().includes(normalizedSearch)
        const matchesStatus = statusFilter === 'All' || activity.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((first, second) => {
        return sortOrder === 'Newest First'
          ? second.createdAt - first.createdAt
          : first.createdAt - second.createdAt
      })
  }, [activities, searchTerm, sortOrder, statusFilter])

  function handleAddActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActivityFormError(null)

    const recipient = newRecipient.trim()
    const subject = newSubject.trim()

    if (!recipient) {
      setActivityFormError('Recipient email is required.')
      return
    }

    if (!emailRegex.test(recipient)) {
      setActivityFormError('Please enter a valid recipient email.')
      return
    }

    if (!subject) {
      setActivityFormError('Subject is required.')
      return
    }

    onAddActivity({ recipient, subject, status: newStatus })
    setNewRecipient('')
    setNewSubject('')
    setNewStatus('Pending')
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Activity Log</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Bulk Email Activity</h2>
        </div>
        <p className="text-sm text-slate-500">{activities.length} operations</p>
      </div>

      <form className="mb-5 rounded-3xl border border-white/10 bg-slate-900/70 p-4" onSubmit={handleAddActivity}>
        <div className="grid gap-3 md:grid-cols-[minmax(0,_1fr)_minmax(0,_1fr)_140px_auto] md:items-end">
          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Recipient</span>
            <input
              type="email"
              value={newRecipient}
              onChange={(event) => setNewRecipient(event.target.value)}
              placeholder="student@example.com"
              className={fieldClass}
            />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Subject</span>
            <input
              type="text"
              value={newSubject}
              onChange={(event) => setNewSubject(event.target.value)}
              placeholder="Project Update"
              className={fieldClass}
            />
          </label>

          <label className="block text-sm text-slate-300">
            <span className="text-slate-400">Status</span>
            <select
              value={newStatus}
              onChange={(event) => setNewStatus(event.target.value as ActivityStatus)}
              className={`${selectClass} mt-2 py-3`}
            >
              <option>Pending</option>
              <option>Sending</option>
              <option>Sent</option>
              <option>Failed</option>
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Email
          </button>
        </div>

        {activityFormError && (
          <div className="mt-3 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-200">
            {activityFormError}
          </div>
        )}
      </form>

      <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,_1fr)_160px_160px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search recipient"
            className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className={selectClass}
          aria-label="Status filter"
        >
          <option>All</option>
          <option>Sent</option>
          <option>Pending</option>
          <option>Sending</option>
          <option>Failed</option>
        </select>

        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value as SortOrder)}
          className={selectClass}
          aria-label="Sort order"
        >
          <option>Newest First</option>
          <option>Oldest First</option>
        </select>
      </div>

      {activities.length === 0 ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/50 p-8 text-center text-sm text-slate-500">
          No bulk email activity yet.
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/50 p-8 text-center text-sm text-slate-500">
          No activity matches the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} onRemove={onRemoveActivity} />
          ))}
        </div>
      )}
    </section>
  )
}

function ActivityCard({ activity, onRemove }: { activity: BulkActivity; onRemove: (activityId: string) => void }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/75 p-4 transition hover:border-slate-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <StatusBadge status={activity.status} />
          <p className="mt-3 truncate text-sm font-semibold text-white">{activity.recipient}</p>
          <p className="mt-1 truncate text-sm text-slate-400">{activity.subject}</p>
          {activity.detail && <p className="mt-2 text-xs text-rose-200">{activity.detail}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
          <time className="text-sm text-slate-500">{activity.time}</time>
          <button
            type="button"
            onClick={() => onRemove(activity.id)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Remove
          </button>
        </div>
      </div>
    </article>
  )
}

function StatusBadge({ status }: { status: ActivityStatus }) {
  const Icon = statusIcons[status]
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}>
      <Icon className={`h-3.5 w-3.5 ${status === 'Sending' ? 'animate-spin' : ''}`} aria-hidden="true" />
      {status}
    </span>
  )
}

export default function BulkEmailUpload() {
  const [recipients, setRecipients] = useState<BulkRecipient[]>([])
  const [activities, setActivities] = useState<BulkActivity[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [attachmentName, setAttachmentName] = useState<string | null>(null)
  const [recipientInputKey, setRecipientInputKey] = useState(0)
  const [attachmentInputKey, setAttachmentInputKey] = useState(0)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [sendStatus, setSendStatus] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendLoading, setSendLoading] = useState(false)

  const validRecipients = useMemo(() => recipients.filter((recipient) => recipient.valid), [recipients])
  const validCount = validRecipients.length
  const invalidCount = recipients.length - validCount

  const sentCount = activities.filter((activity) => activity.status === 'Sent').length
  const pendingCount = activities.filter((activity) => activity.status === 'Pending' || activity.status === 'Sending').length
  const failedCount = activities.filter((activity) => activity.status === 'Failed').length

  const summaryItems: SummaryItem[] = [
    {
      label: 'Total Recipients',
      value: validCount,
      icon: Users,
      accentClass: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
    },
    {
      label: 'Emails Sent',
      value: sentCount,
      icon: MailCheck,
      accentClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    },
    {
      label: 'Pending',
      value: pendingCount,
      icon: Clock3,
      accentClass: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    },
    {
      label: 'Failed',
      value: failedCount,
      icon: AlertCircle,
      accentClass: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
    },
  ]

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSendError(null)
    setSendStatus(null)

    if (validRecipients.length === 0) {
      setSendError('There are no valid recipients to send to.')
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

    if (cc && !validateEmailList(cc)) {
      setSendError('Please enter only valid CC email addresses.')
      return
    }

    if (bcc && !validateEmailList(bcc)) {
      setSendError('Please enter only valid BCC email addresses.')
      return
    }

    const batchId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const startedAt = Date.now()
    const currentSubject = subject.trim()
    const operationActivities = validRecipients.map((recipient, index) => {
      const createdAt = startedAt + index
      return {
        id: `${batchId}-${index}`,
        batchId,
        recipient: recipient.email,
        status: 'Sending' as const,
        time: formatActivityTime(new Date(createdAt)),
        subject: currentSubject,
        createdAt,
      }
    })

    setActivities((current) => [...operationActivities, ...current])

    try {
      setSendLoading(true)
      const response = await api.post('/bulk-email/send', {
        subject: currentSubject,
        body: body.trim(),
        recipients: validRecipients.map((recipient) => recipient.email),
        cc: parseEmailList(cc),
        bcc: parseEmailList(bcc),
      })

      const failures = new Set<string>(response.data.failures || [])
      const completedAt = Date.now()

      setActivities((current) =>
        current.map((activity) => {
          if (activity.batchId !== batchId) {
            return activity
          }

          const failed = failures.has(activity.recipient)
          return {
            ...activity,
            status: failed ? 'Failed' : 'Sent',
            detail: failed ? 'Delivery failed' : undefined,
            time: formatActivityTime(new Date(completedAt)),
          }
        }),
      )

      setSendStatus(`Sent ${response.data.sentCount} emails. ${response.data.failedCount} failures.`)
      if (response.data.failedCount > 0) {
        setSendError(`Failed recipients: ${response.data.failures.join(', ')}`)
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to send bulk email. Please try again.')
      const failedAt = Date.now()

      setActivities((current) =>
        current.map((activity) =>
          activity.batchId === batchId
            ? {
                ...activity,
                status: 'Failed',
                detail: message,
                time: formatActivityTime(new Date(failedAt)),
              }
            : activity,
        ),
      )
      setSendError(message)
    } finally {
      setSendLoading(false)
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploadError(null)
    setSendError(null)
    setSendStatus(null)
    setLoading(true)
    setFileName(file.name)

    try {
      const form = new FormData()
      form.append('file', file)

      const response = await api.post('/bulk-email/upload', form)
      setRecipients(response.data.recipients)
    } catch (error) {
      setRecipients([])
      setUploadError(getErrorMessage(error, 'Unable to parse CSV file. Please check the format.'))
    } finally {
      setLoading(false)
    }
  }

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setAttachmentName(file ? file.name : null)
  }

  function removeRecipient(index: number) {
    setRecipients((current) => current.filter((_, i) => i !== index))
  }

  function addActivity(draft: ActivityDraft) {
    const createdAt = Date.now()
    const activity: BulkActivity = {
      id: `manual-${createdAt}-${Math.random().toString(36).slice(2)}`,
      batchId: `manual-${createdAt}`,
      recipient: draft.recipient,
      status: draft.status,
      time: formatActivityTime(new Date(createdAt)),
      subject: draft.subject,
      createdAt,
      detail: draft.status === 'Failed' ? 'Manual log entry' : undefined,
    }

    setActivities((current) => [activity, ...current])
  }

  function removeActivity(activityId: string) {
    setActivities((current) => current.filter((activity) => activity.id !== activityId))
  }

  function clearForm() {
    setRecipients([])
    setUploadError(null)
    setLoading(false)
    setFileName(null)
    setAttachmentName(null)
    setRecipientInputKey((current) => current + 1)
    setAttachmentInputKey((current) => current + 1)
    setSubject('')
    setBody('')
    setCc('')
    setBcc('')
    setSendStatus(null)
    setSendError(null)
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <SummaryCard key={item.label} {...item} />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_3fr)] lg:items-start">
        <ComposePanel
          recipients={recipients}
          validCount={validCount}
          invalidCount={invalidCount}
          fileName={fileName}
          attachmentName={attachmentName}
          uploadError={uploadError}
          loading={loading}
          subject={subject}
          body={body}
          cc={cc}
          bcc={bcc}
          sendStatus={sendStatus}
          sendError={sendError}
          sendLoading={sendLoading}
          recipientInputKey={recipientInputKey}
          attachmentInputKey={attachmentInputKey}
          onFileChange={handleFileChange}
          onAttachmentChange={handleAttachmentChange}
          onSubjectChange={setSubject}
          onBodyChange={setBody}
          onCcChange={setCc}
          onBccChange={setBcc}
          onRemoveRecipient={removeRecipient}
          onSubmit={handleSend}
          onClear={clearForm}
        />

        <ActivityPanel
          activities={activities}
          onAddActivity={addActivity}
          onRemoveActivity={removeActivity}
        />
      </div>
    </div>
  )
}
