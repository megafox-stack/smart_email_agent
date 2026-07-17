import api from './api'
import type { Contact } from '../types/contact'

export async function fetchContacts(): Promise<Contact[]> {
  const response = await api.get('/api/contacts')
  return Array.isArray(response.data) ? response.data : []
}

export async function addContact(payload: { name: string; email: string }): Promise<Contact> {
  const response = await api.post('/api/contacts', payload)
  return response.data
}

export async function updateContact(id: string, payload: { name: string; email: string }): Promise<Contact> {
  const response = await api.put(`/api/contacts/${id}`, payload)
  return response.data
}

export async function deleteContact(id: string): Promise<void> {
  await api.delete(`/api/contacts/${id}`)
}

export async function importContactsFromCsv(file: File): Promise<Contact[]> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/bulk-email/upload', formData)
  const recipients = Array.isArray(response.data?.recipients) ? response.data.recipients : []

  const validContacts = recipients.filter((recipient: Contact & { valid?: boolean }) => recipient.valid !== false)
  const created: Contact[] = []

  for (const recipient of validContacts) {
    const contactResponse = await api.post('/api/contacts', {
      name: recipient.name,
      email: recipient.email,
    })
    created.push(contactResponse.data)
  }

  return created
}

export async function fetchContactsAsPlainText(): Promise<string> {
  const contacts = await fetchContacts()
  return contacts.map((contact) => `${contact.name},${contact.email}`).join('\n')
}

export async function getContactInsights(id: string): Promise<string | null> {
  const response = await api.get(`/api/contacts/${id}/insights`)
  return response.data?.ai_insights ?? null
}

export async function saveContactInsights(id: string, insights: string): Promise<string> {
  const response = await api.put(`/api/contacts/${id}/insights`, { ai_insights: insights })
  return response.data?.ai_insights ?? ''
}
