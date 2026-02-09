import { useState, useCallback } from 'react'

import { API_SERVER } from '../../config/api'

export function useEmailService() {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [lastResult, setLastResult] = useState(null)

  const sendEmail = useCallback(async ({ to, subject, body, leadId, templateId, cvId }) => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`${API_SERVER}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body, leadId, templateId, cvId })
      })
      const data = await res.json()
      setLastResult(data)

      if (!data.success) {
        throw new Error(data.error)
      }

      return data
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setSending(false)
    }
  }, [])

  const sendWithTemplate = useCallback(async ({ leadId, templateId }) => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`${API_SERVER}/api/email/send-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, templateId })
      })
      const data = await res.json()
      setLastResult(data)

      if (!data.success) {
        throw new Error(data.error)
      }

      return data
    } catch (err) {
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
        method: 'POST'
      })
      const data = await res.json()
      setLastResult(data)
      return data
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setSending(false)
    }
  }, [])

  // AI Agent action - for automation
  const executeAgentAction = useCallback(async (action, params) => {
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`${API_SERVER}/api/agent/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params })
      })
      const data = await res.json()
      setLastResult(data)
      return data
    } catch (err) {
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
