import type { Contact } from '../types/contact'

interface ContactCardProps {
  contact: Contact
  onSend: (contact: Contact) => void
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
}

export default function ContactCard({ contact, onSend, onEdit, onDelete }: ContactCardProps) {
  const initial = contact.name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:bg-slate-950 hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-slate-100">
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-white">{contact.name}</h3>
          <p className="mt-1 truncate text-sm text-slate-400">{contact.email}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onSend(contact)}
          className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
        >
          ✉ Send Email
        </button>
        <button
          type="button"
          onClick={() => onEdit(contact)}
          className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
        >
          ✏ Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(contact)}
          className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
        >
          🗑 Delete
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
        AI Insights (Coming Soon)
      </div>
    </div>
  )
}
