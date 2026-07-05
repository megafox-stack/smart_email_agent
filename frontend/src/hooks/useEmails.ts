import { useEffect, useMemo, useState, useCallback } from 'react'
import api from '../services/api'
import axios from 'axios'
import type { Email } from '../types/email'

interface EmailResponse {
  emails: Email[]
}

export type ErrorState = { message: string; status?: number } | null

export function useEmails() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<ErrorState>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [activeFolder, setActiveFolder] = useState<string>('Inbox')

  // helper to determine folder/category for an email
  const categorize = useCallback((email: Email) => {
    // If already classified, trust stored category
    if ((email as any).category) return (email as any).category
    const subject = (email.subject || '').toLowerCase()
    const sender = (email.sender || '').toLowerCase()

    // try to extract an email address from the sender string
    const emailMatch = sender.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)
    const domain = emailMatch ? emailMatch[0].split('@')[1] : ''

    // Expanded keyword lists
    const universityKeywords = ['university', 'admissions', 'course', 'syllabus', 'assignment', 'lecture', 'student', 'professor', 'exam', 'degree', 'edu']
    const promotionsKeywords = ['sale', 'offer', 'discount', 'promo', 'newsletter', 'deal', 'coupon', 'save']
    const spamKeywords = ['unsubscribe', 'win', 'congratulations', 'prize', 'free', 'winner']
    const importantKeywords = ['urgent', 'important', 'asap', 'please read', 'invoice', 'payment', 'due', 'deadline', 'action required']

    if (domain.endsWith('.edu')) return 'University'

    if (universityKeywords.some((k) => subject.includes(k) || sender.includes(k))) return 'University'

    if (promotionsKeywords.some((k) => subject.includes(k) || sender.includes(k))) return 'Promotions'

    if (spamKeywords.some((k) => subject.includes(k) || sender.includes(k))) return 'Spam'

    if (importantKeywords.some((k) => subject.includes(k) || sender.includes(k))) return 'Important'

    return 'Inbox'
  }, [])

  const classifyEmails = useCallback(() => {
    setEmails((prev) => prev.map((e) => ({ ...e, category: categorize(e) })))
  }, [categorize])

  const fetchEmails = useCallback(async (attempt = 1) => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<EmailResponse>('/emails')
      const fetched = response.data.emails || []
      // ask the backend classifier to label the fetched emails
      try {
        const classifyResp = await api.post('/classify', { emails: fetched })
        const categories = classifyResp.data?.categories || []
        const catMap = new Map<string, string>(categories.map((c: any) => [c.id, c.category]))
        const classified = fetched.map((e) => ({ ...e, category: catMap.get(e.id) || categorize(e) }))
        setEmails(classified)
        // log for debugging
        // eslint-disable-next-line no-console
        console.debug('Server-classified emails:', classified.map((m) => ({ id: m.id, subject: m.subject, sender: m.sender, category: (m as any).category })))
        setError(null)
        return true
      } catch (err) {
        // classification endpoint failed; fall back to client-side categorize
        const fallback = fetched.map((e) => ({ ...e, category: categorize(e) }))
        setEmails(fallback)
        // eslint-disable-next-line no-console
        console.debug('Fallback-classified emails:', fallback.map((m) => ({ id: m.id, subject: m.subject, sender: m.sender, category: (m as any).category })))
        setError(null)
        return true
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        if (status === 401) {
          setError({ message: err.response?.data?.detail || 'Not authenticated', status: 401 })
          setLoading(false)
          return false
        }

        // Network / no response
        if (!err.response) {
          if (attempt < 3) {
            // retry after delay
            await new Promise((r) => setTimeout(r, 1500 * attempt))
            return fetchEmails(attempt + 1)
          }
          setError({ message: 'Network error. Please check your connection.' })
        } else {
          setError({ message: err.response?.data?.detail || err.message, status })
        }
      } else if (err instanceof Error) {
        setError({ message: err.message })
      } else {
        setError({ message: 'Unable to fetch emails' })
      }

      return false
    } finally {
      setLoading(false)
    }
  }, [categorize])

  useEffect(() => {
    // initial load
    fetchEmails()
  }, [fetchEmails])

  const filteredEmails = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()

    // start with folder filtering (use categorize helper that prefers stored category)
    let list = emails
    if (activeFolder && activeFolder !== 'Inbox') {
      list = emails.filter((e) => categorize(e) === activeFolder)
    }

    if (!normalized) return list

    return list.filter((email) => {
      return (
        email.subject.toLowerCase().includes(normalized) ||
        email.sender.toLowerCase().includes(normalized)
      )
    })
  }, [emails, searchTerm, activeFolder])

  const stats = useMemo(() => {
    const total = emails.length
    const important = emails.filter((e) => (e as any).category === 'Important').length
    const university = emails.filter((e) => (e as any).category === 'University').length
    const spam = emails.filter((e) => (e as any).category === 'Spam').length
    return { total, important, university, spam }
  }, [emails])

  return {
    emails,
    filteredEmails,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedEmail,
    setSelectedEmail,
    stats,
    refresh: fetchEmails,
    classifyEmails,
    loginUrl: 'http://localhost:8000/login',
    activeFolder,
    setActiveFolder,
  }
}
