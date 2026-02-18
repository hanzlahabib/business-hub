import { useState, useCallback } from 'react'
import { ENDPOINTS } from '../../config/api'
import { useAuth } from '../../hooks/useAuth'
import { getAuthHeaders, getJsonAuthHeaders, fetchGet, fetchMutation } from '../../utils/authHeaders'

export interface Message {
  id: string
  leadId?: string
  type: 'sent' | 'received'
  channel: 'email' | 'whatsapp' | 'linkedin' | 'call'
  subject?: string
  body?: string
  status?: string
  createdAt: string
}

export interface MessageStats {
  total: number
  sent: number
  received: number
  byChannel: {
    email: number
    whatsapp: number
    linkedin: number
    call: number
  }
  lastContact: string | null
}

export function useMessages() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMessagesByLead = useCallback(async (leadId: string) => {
    if (!user) return []
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGet(`${ENDPOINTS.MESSAGES}/lead/${leadId}`)
      if (data.success) {
        setMessages(data.messages)
        return data.messages
      }
      throw new Error(data.error)
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  const logReceivedMessage = useCallback(async ({ leadId, channel, subject, body }: Partial<Message>) => {
    if (!user) return null
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMutation(`${ENDPOINTS.MESSAGES}/received`, 'POST', { leadId, channel, subject, body })
      if (data.success) {
        setMessages(prev => [data.message, ...prev])
        return data.message
      }
      throw new Error(data.error)
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const logCall = useCallback(async ({ leadId, notes, outcome }: { leadId: string; notes?: string; outcome?: string }) => {
    if (!user) return null
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMutation(`${ENDPOINTS.MESSAGES}/call`, 'POST', { leadId, notes, outcome })
      if (data.success) {
        setMessages(prev => [data.message, ...prev])
        return data.message
      }
      throw new Error(data.error)
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const getMessageStats = useCallback(async (leadId: string): Promise<MessageStats | null> => {
    if (!user) return null
    try {
      const data = await fetchGet(`${ENDPOINTS.MESSAGES}/stats/${leadId}`)
      if (data.success) {
        return data.stats
      }
      return null
    } catch {
      return null
    }
  }, [user])

  return {
    messages,
    loading,
    error,
    fetchMessagesByLead,
    logReceivedMessage,
    logCall,
    getMessageStats
  }
}

export default useMessages
