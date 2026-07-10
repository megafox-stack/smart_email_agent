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
