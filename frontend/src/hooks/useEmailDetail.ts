import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import type { EmailDetail } from '../types/email'

export function useEmailDetail(id: string | null) {
  const [email, setEmail] = useState<EmailDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/email/${id}`)
      setEmail(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Unable to load message')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  return { email, loading, error, refresh: fetchDetail }
}
