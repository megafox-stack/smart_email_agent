import { useEffect, useMemo, useState } from 'react'
import AddContactModal from '../components/AddContactModal'
import ContactList from '../components/ContactList'
import { addContact, deleteContact, fetchContacts, updateContact } from '../services/contactService'
import type { Contact } from '../types/contact'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const data = await fetchContacts()
        if (active) setContacts(data)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    function onContactsUpdated() {
      let mounted = true
      ;(async () => {
        try {
          const data = await fetchContacts()
          if (mounted) setContacts(data)
        } finally {
          if (mounted) setLoading(false)
        }
      })()

      return () => {
        mounted = false
      }
    }

    window.addEventListener('contacts:updated', onContactsUpdated as EventListener)
    return () => window.removeEventListener('contacts:updated', onContactsUpdated as EventListener)
  }, [])

  const filteredContacts = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return contacts

    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(value) || contact.email.toLowerCase().includes(value),
    )
  }, [contacts, query])

  function openAddModal() {
    setEditingContact(null)
    setModalOpen(true)
  }

  function openEditModal(contact: Contact) {
    setEditingContact(contact)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingContact(null)
  }

  async function handleSave(payload: { name: string; email: string }) {
    if (editingContact) {
      const updated = await updateContact(editingContact.id, payload)
      setContacts((current) => current.map((contact) => (contact.id === updated.id ? updated : contact)))
    } else {
      const created = await addContact(payload)
      setContacts((current) => [created, ...current])
    }

    closeModal()
  }

  async function handleDelete(contact: Contact) {
    const confirmed = window.confirm(`Delete ${contact.name}?`)
    if (!confirmed) return

    await deleteContact(contact.id)
    setContacts((current) => current.filter((item) => item.id !== contact.id))
  }

  function handleSend(contact: Contact) {
    window.location.href = `/compose?to=${encodeURIComponent(contact.email)}`
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Contacts</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Contact Management</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Manage your contacts for faster email communication.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="rounded-3xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          Add Contact
        </button>
      </div>

      <div className="mt-6">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search contacts by name or email..."
          className="w-full rounded-3xl border border-white/10 bg-slate-900/90 px-5 py-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-white/10 bg-slate-950/60">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500/20 border-t-sky-400" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-950/60 px-6 text-center">
            <div className="text-6xl">👤</div>
            <h3 className="mt-5 text-2xl font-semibold text-white">No Contacts Yet</h3>
            <p className="mt-3 max-w-md text-sm text-slate-400">
              Add your first contact to start sending emails faster.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-6 rounded-3xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              Add Contact
            </button>
          </div>
        ) : (
          <ContactList
            contacts={filteredContacts}
            onSend={handleSend}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}
      </div>

      <AddContactModal
        open={modalOpen}
        initial={editingContact ? { name: editingContact.name, email: editingContact.email } : null}
        onClose={closeModal}
        onSave={handleSave}
      />
    </section>
  )
}
