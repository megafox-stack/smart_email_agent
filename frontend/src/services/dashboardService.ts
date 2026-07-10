import api from './api'

export interface DashboardStats {
  totalRecipients: number
  emailsSent: number
  pending: number
  failed: number
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await api.get('/api/dashboard-stats')
  return response.data
}
