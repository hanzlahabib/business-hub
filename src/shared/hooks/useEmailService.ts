import { useState, useCallback } from 'react'

import { API_SERVER } from '../../config/api'
import { fetchMutation } from '../../utils/authHeaders'

export function useEmailService() {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<any>(null)

  const sendEmail = useCallback(async ({ to, subject, body, leadId, templateId, cvId }: any) => {
    setSending(true)
    setError(null)
    try {
      const data = await fetchMutation(`${API_SERVER}/api/email/send`, 'POST', { to, subject, body, leadId, templateId, cvId })
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
      const data = await fetchMutation(`${API_SERVER}/api/email/send-template`, 'POST', { leadId, templateId })
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
      const data = await fetchMutation(`${API_SERVER}/api/email/test`, 'POST')
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
      const data = await fetchMutation(`${API_SERVER}/api/agent/execute`, 'POST', { action, params })
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
