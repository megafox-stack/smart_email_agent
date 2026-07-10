import type { Contact } from '../types/contact'
import ContactCard from './ContactCard'

interface ContactListProps {
  contacts: Contact[]
  onSend: (contact: Contact) => void
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
}

export default function ContactList({ contacts, onSend, onEdit, onDelete }: ContactListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onSend={onSend}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
