import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  CalendarDays,
  Check,
  Globe2,
  Info,
  Mail,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import type { ErrorState } from '../hooks/useEmails'

type ReminderOption = 'None' | '1 Day' | '2 Days' | '7 Days'

interface SettingsState {
  gmailDisconnected: boolean
  lastSynchronization: string
  ruleEngine: Record<string, boolean>
  trustedDomains: string[]
  notifications: Record<string, boolean>
  calendar: {
    autoAddEvents: boolean
    reminderBeforeEvent: ReminderOption
  }
  categories: Record<string, boolean>
  security: {
    trustedSenders: number
    blockedSenders: number
    unknownSenders: number
    lastSecurityScan: string
  }
}

interface SettingsPanelProps {
  error: ErrorState
  emailCount: number
  refreshing: boolean
  onRefreshInbox: () => Promise<boolean>
}

const storageKey = 'emailAutomationAgentSettings'

const defaultSettings: SettingsState = {
  gmailDisconnected: false,
  lastSynchronization: 'Not synchronized yet',
  ruleEngine: {
    'Enable Rule Engine': true,
    'Auto Categorize Emails': true,
    'Detect Deadlines': true,
    'Detect Meetings': true,
    'Detect Action Items': true,
    'Detect University Emails': true,
    'Detect Promotions': true,
    'Detect Spam': true,
    'Detect Suspicious Emails': true,
    'Auto Assign Priority': true,
  },
  trustedDomains: ['gmail.com', 'edu', 'college.edu'],
  notifications: {
    'Deadline Alerts': true,
    'Meeting Alerts': true,
    'Assignment Alerts': true,
    'High Priority Alerts': true,
    'Security Alerts': true,
    'Daily Summary': false,
  },
  calendar: {
    autoAddEvents: true,
    reminderBeforeEvent: '1 Day',
  },
  categories: {
    Assignments: true,
    Exams: true,
    Meetings: true,
    Workshops: true,
    Placements: true,
    Finance: true,
    Promotions: true,
    Spam: true,
    Personal: true,
  },
  security: {
    trustedSenders: 12,
    blockedSenders: 3,
    unknownSenders: 0,
    lastSecurityScan: 'Not scanned yet',
  },
}

const cardClass = 'rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft'
const inputClass =
  'w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'

export default function SettingsPanel({ error, emailCount, refreshing, onRefreshInbox }: SettingsPanelProps) {
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings())
  const [draftSettings, setDraftSettings] = useState<SettingsState>(() => loadSettings())
  const [domainInput, setDomainInput] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const gmailConnected = !draftSettings.gmailDisconnected && error?.status !== 401
  const ruleStats = useMemo(() => {
    const values = Object.values(draftSettings.ruleEngine)
    const enabled = values.filter(Boolean).length
    return {
      total: values.length,
      enabled,
      disabled: values.length - enabled,
    }
  }, [draftSettings.ruleEngine])

  useEffect(() => {
    setDraftSettings(settings)
  }, [settings])

  function updateToggle(section: 'ruleEngine' | 'notifications' | 'categories', key: string) {
    setDraftSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: !current[section][key],
      },
    }))
  }

  function addDomain() {
    const value = domainInput.trim().toLowerCase()
    if (!value || draftSettings.trustedDomains.includes(value)) {
      return
    }

    setDraftSettings((current) => ({
      ...current,
      trustedDomains: [...current.trustedDomains, value],
    }))
    setDomainInput('')
  }

  function removeDomain(domain: string) {
    setDraftSettings((current) => ({
      ...current,
      trustedDomains: current.trustedDomains.filter((item) => item !== domain),
    }))
  }

  async function refreshInbox() {
    const success = await onRefreshInbox()
    if (!success) {
      setStatusMessage('Inbox refresh failed. Check Gmail connection.')
      return
    }

    const timestamp = new Date().toLocaleString()
    setDraftSettings((current) => ({
      ...current,
      gmailDisconnected: false,
      lastSynchronization: timestamp,
    }))
    setStatusMessage('Inbox refreshed.')
  }

  function disconnectAccount() {
    setDraftSettings((current) => ({
      ...current,
      gmailDisconnected: true,
    }))
    setStatusMessage('Gmail account disconnected in local settings.')
  }

  function saveSettings() {
    localStorage.setItem(storageKey, JSON.stringify(draftSettings))
    setSettings(draftSettings)
    setStatusMessage('Settings saved.')
  }

  function cancelChanges() {
    setDraftSettings(settings)
    setDomainInput('')
    setStatusMessage('Changes canceled.')
  }

  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-sky-400/80">Settings</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Email Automation Agent</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-400">
              Configure rule-based automation, notifications, trusted domains, calendar behavior, and local security preferences.
            </p>
          </div>
          {statusMessage && (
            <div className="rounded-3xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
              {statusMessage}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SettingsCard icon={Mail} title="Gmail Connection">
          {gmailConnected ? (
            <div className="grid gap-4">
              <InfoRow label="Connected Gmail Account" value="Authenticated Gmail session" />
              <InfoRow label="Connection Status" value="Connected" valueClassName="text-emerald-300" />
              <InfoRow label="Last Synchronization" value={draftSettings.lastSynchronization} />
              <InfoRow label="Loaded Inbox Messages" value={String(emailCount)} />
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-900/50 p-5 text-sm text-slate-500">
              No Gmail account connected.
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={refreshInbox}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              <RotateCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh Inbox
            </button>
            <button
              type="button"
              onClick={disconnectAccount}
              className="inline-flex items-center justify-center gap-2 rounded-3xl border border-rose-500/20 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Disconnect Account
            </button>
          </div>
        </SettingsCard>

        <SettingsCard icon={SlidersHorizontal} title="Rule Engine Configuration">
          <ToggleGrid
            values={draftSettings.ruleEngine}
            onToggle={(key) => updateToggle('ruleEngine', key)}
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Total Rules" value={ruleStats.total} />
            <MiniStat label="Enabled Rules" value={ruleStats.enabled} />
            <MiniStat label="Disabled Rules" value={ruleStats.disabled} />
          </div>
        </SettingsCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SettingsCard icon={Globe2} title="Trusted Domains">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={domainInput}
              onChange={(event) => setDomainInput(event.target.value)}
              placeholder="example.edu"
              className={inputClass}
            />
            <button
              type="button"
              onClick={addDomain}
              className="rounded-3xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              Add Domain
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {draftSettings.trustedDomains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200"
              >
                {domain}
                <button
                  type="button"
                  onClick={() => removeDomain(domain)}
                  className="rounded-full p-0.5 text-emerald-100 transition hover:bg-white/10"
                  aria-label={`Remove ${domain}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard icon={Bell} title="Notifications">
          <ToggleGrid
            values={draftSettings.notifications}
            onToggle={(key) => updateToggle('notifications', key)}
          />
        </SettingsCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SettingsCard icon={CalendarDays} title="Event Calendar">
          <ToggleRow
            label="Automatically add extracted events"
            enabled={draftSettings.calendar.autoAddEvents}
            onToggle={() =>
              setDraftSettings((current) => ({
                ...current,
                calendar: {
                  ...current.calendar,
                  autoAddEvents: !current.calendar.autoAddEvents,
                },
              }))
            }
          />
          <label className="mt-5 block text-sm text-slate-300">
            <span className="text-slate-400">Reminder before event</span>
            <select
              value={draftSettings.calendar.reminderBeforeEvent}
              onChange={(event) =>
                setDraftSettings((current) => ({
                  ...current,
                  calendar: {
                    ...current.calendar,
                    reminderBeforeEvent: event.target.value as ReminderOption,
                  },
                }))
              }
              className={`${inputClass} mt-2`}
            >
              <option>None</option>
              <option>1 Day</option>
              <option>2 Days</option>
              <option>7 Days</option>
            </select>
          </label>
        </SettingsCard>

        <SettingsCard icon={Check} title="Email Categories">
          <ToggleGrid
            values={draftSettings.categories}
            onToggle={(key) => updateToggle('categories', key)}
          />
        </SettingsCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SettingsCard icon={ShieldCheck} title="Security">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Trusted Senders" value={String(draftSettings.security.trustedSenders)} />
            <InfoRow label="Blocked Senders" value={String(draftSettings.security.blockedSenders)} />
            <InfoRow label="Unknown Senders" value={String(draftSettings.security.unknownSenders)} />
            <InfoRow label="Last Security Scan" value={draftSettings.security.lastSecurityScan} />
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="rounded-3xl border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Manage Trusted Senders
            </button>
            <button
              type="button"
              className="rounded-3xl border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Manage Blocked Senders
            </button>
          </div>
        </SettingsCard>

        <SettingsCard icon={Info} title="Application Information">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Project Name" value="Email Automation Agent" />
            <InfoRow label="Version" value="1.0" />
            <InfoRow label="Framework" value="React + Vite" />
            <InfoRow label="UI" value="Tailwind CSS" />
            <InfoRow label="Rule Engine Version" value="1.0" />
          </div>
        </SettingsCard>
      </section>

      <section className="flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={saveSettings}
          className="inline-flex items-center justify-center gap-2 rounded-3xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save Settings
        </button>
        <button
          type="button"
          onClick={cancelChanges}
          className="rounded-3xl border border-white/10 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          Cancel
        </button>
      </section>
    </div>
  )
}

function SettingsCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Mail
  title: string
  children: React.ReactNode
}) {
  return (
    <section className={cardClass}>
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-300">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ToggleGrid({ values, onToggle }: { values: Record<string, boolean>; onToggle: (key: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Object.entries(values).map(([label, enabled]) => (
        <ToggleRow key={label} label={label} enabled={enabled} onToggle={() => onToggle(label)} />
      ))}
    </div>
  )
}

function ToggleRow({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-3 text-left transition hover:bg-slate-900"
    >
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <span className={`flex h-7 w-12 items-center rounded-full p-1 transition ${enabled ? 'bg-sky-500' : 'bg-slate-700'}`}>
        <span className={`h-5 w-5 rounded-full bg-white transition ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </span>
    </button>
  )
}

function InfoRow({ label, value, valueClassName = 'text-slate-100' }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 break-words text-sm font-semibold ${valueClassName}`}>{value}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function loadSettings(): SettingsState {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) {
      return defaultSettings
    }

    return {
      ...defaultSettings,
      ...JSON.parse(saved),
    }
  } catch {
    return defaultSettings
  }
}
