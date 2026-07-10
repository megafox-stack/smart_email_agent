import api from './api'

export interface PhishingResult {
  riskScore: number
  classification: string
  safe: boolean
  reasons: string[]
  aiAnalysis: string
  links: string[]
}

type CachedPhishingResult = { result: PhishingResult; timestamp: number }

const cache = new Map<string, CachedPhishingResult>()
const CACHE_TTL_MS = 5 * 60 * 1000

function extractLinks(text: string): string[] {
  if (!text) return []
  const regex = /https?:\/\/[^\s"'<>]+/gi
  const matches = text.match(regex)
  return matches ? Array.from(new Set(matches)) : []
}

export async function analyzeEmailPhishing(
  emailId: string,
  payload: { sender: string; subject: string; body: string },
): Promise<PhishingResult> {
  if (!emailId) {
    throw new Error('Email ID is required for phishing analysis.')
  }

  if (cache.has(emailId)) {
    const cached = cache.get(emailId)!
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.result
    }

    cache.delete(emailId)
  }

  const requestBody = {
    sender: payload.sender,
    subject: payload.subject,
    body: payload.body,
    links: extractLinks(payload.body),
  }

  try {
    const response = await api.post('/api/phishing-check', requestBody)
    const data = response.data

    if (!data || typeof data.riskScore !== 'number') {
      throw new Error('Invalid response from phishing check.')
    }

    const rawScore = Number(data.riskScore)
    const riskScore = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, rawScore)) : 0

    const result: PhishingResult = {
      riskScore,
      classification: data.classification || 'Unknown',
      safe: Boolean(data.safe),
      reasons: Array.isArray(data.reasons) ? data.reasons : [],
      aiAnalysis: data.aiAnalysis || '',
      links: Array.isArray(data.links) ? data.links : [],
    }

    cache.set(emailId, { result, timestamp: Date.now() })
    return result
  } catch (error: any) {
    const message =
      error?.response?.data?.detail || error?.message || 'Unable to analyze this email.'
    throw new Error(message)
  }
}
