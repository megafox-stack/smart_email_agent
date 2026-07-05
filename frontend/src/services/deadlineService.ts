import api from './api'

export interface DeadlineItem {
  title: string
  date: string
  time: string
  remainingDays: number
  priority: string
}

export interface DeadlineResult {
  deadlines: DeadlineItem[]
}

const cache = new Map<string, DeadlineResult>()

export async function extractDeadlines(
  emailId: string,
  payload: { subject: string; sender: string; body: string },
): Promise<DeadlineResult> {
  if (!emailId) {
    throw new Error('Email ID is required for deadline extraction.')
  }

  if (cache.has(emailId)) {
    return cache.get(emailId) as DeadlineResult
  }

  try {
    const response = await api.post('/api/extract-deadlines', payload)
    const data = response.data

    if (!data || !Array.isArray(data.deadlines)) {
      throw new Error('Invalid response from deadline extraction.')
    }

    const result: DeadlineResult = {
      deadlines: data.deadlines.map((item: any) => ({
        title: String(item.title || 'Untitled deadline'),
        date: String(item.date || ''),
        time: String(item.time || ''),
        remainingDays: Number(item.remainingDays ?? 0),
        priority: String(item.priority || 'Low'),
      })),
    }

    cache.set(emailId, result)
    return result
  } catch (error: any) {
    const message = error?.response?.data?.detail || error?.message || 'Unable to extract deadlines.'
    throw new Error(message)
  }
}
