import api from './api'

// Simple in-memory cache
const _cache: Map<string, string> = new Map()

export async function getSummaryForEmail(
  emailId: string,
  payload: { subject: string; sender: string; body: string }
) {
  if (!emailId) throw new Error('emailId required')

  if (_cache.has(emailId)) {
    return _cache.get(emailId) as string
  }

  const resp = await api.post('/api/summarize', payload)

  const summary: string = resp.data?.summary ?? ''

  _cache.set(emailId, summary)

  return summary
}

export function clearSummaryCache(emailId?: string) {
  if (emailId) {
    _cache.delete(emailId)
  } else {
    _cache.clear()
  }
}