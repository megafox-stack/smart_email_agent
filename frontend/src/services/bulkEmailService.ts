import api from './api'

export interface ActivityLogEntry {
  id: string
  recipient: string
  subject: string
  status: 'Sent' | 'Pending' | 'Failed' | 'Scheduled'
  timestamp: string
  errorMessage?: string | null
}

export interface BulkSendResponse {
  sentCount: number
  failedCount: number
  failures: string[]
}

export async function fetchActivityLog(): Promise<ActivityLogEntry[]> {
  const response = await api.get('/api/activity-log')
  return Array.isArray(response.data) ? response.data : []
}

export async function sendBulkEmail(payload: {
  subject: string
  body: string
  recipients: string[]
  cc?: string[]
  bcc?: string[]
}): Promise<BulkSendResponse> {
  const response = await api.post('/api/send-bulk-email', payload)
  return response.data
}
