import type { Email } from '../types/email'

interface EmailCardProps {
  email: Email
  onSelect: (email: Email) => void
}

export default function EmailCard({ email, onSelect }: EmailCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(email)}
      className="group flex w-full flex-col gap-2 rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-3 text-left transition hover:border-sky-500/30 hover:bg-slate-900/80"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="truncate text-base font-semibold text-white transition group-hover:text-sky-300">{email.subject}</h3>
        <span className="whitespace-nowrap rounded-full bg-slate-800/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          {email.date}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">From: <span className="text-slate-100">{email.sender}</span></p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); window.location.hash = '#compose'; onSelect(email) }}
          className="ml-2 rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500"
        >
          Reply
        </button>
      </div>
    </button>
  )
}
