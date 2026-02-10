import { useState, useCallback } from 'react'

import { API_SERVER } from '../../config/api'

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  try {
    const stored = localStorage.getItem('auth_user')
    if (stored) { headers['x-user-id'] = JSON.parse(stored).id }
  } catch { }
  return headers
}

export function useEmailService() {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<any>(null)

  const sendEmail = useCallback(async ({ to, subject, body, leadId, templateId, cvId }: any) => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`${API_SERVER}/api/email/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ to, subject, body, leadId, templateId, cvId })
      })
      const data = await res.json()
      setLastResult(data)

      if (!data.success) {
        throw new Error(data.error)
      }

      return data
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setSending(false)
    }
  }, [])

  const sendWithTemplate = useCallback(async ({ leadId, templateId }: any) => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`${API_SERVER}/api/email/send-template`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ leadId, templateId })
      })
      const data = await res.json()
      setLastResult(data)

      if (!data.success) {
        throw new Error(data.error)
      }

      return data
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setSending(false)
    }
  }, [])

  const testConnection = useCallback(async () => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`${API_SERVER}/api/email/test`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      const data = await res.json()
      setLastResult(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setSending(false)
    }
  }, [])

  // AI Agent action - for automation
  const executeAgentAction = useCallback(async (action: string, params: any) => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`${API_SERVER}/api/agent/execute`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action, params })
      })
      const data = await res.json()
      setLastResult(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setSending(false)
    }
  }, [])

  return {
    sending,
    error,
    lastResult,
    sendEmail,
    sendWithTemplate,
    testConnection,
    executeAgentAction
  }
}

export default useEmailService
