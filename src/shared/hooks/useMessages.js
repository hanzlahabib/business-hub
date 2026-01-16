import { useState, useCallback } from 'react'

const JSON_SERVER = 'http://localhost:3001'
const API_SERVER = 'http://localhost:3002'

export function useMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchMessagesByLead = useCallback(async (leadId) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_SERVER}/api/messages/lead/${leadId}`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.messages)
        return data.messages
      }
      throw new Error(data.error)
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const logReceivedMessage = useCallback(async ({ leadId, channel, subject, body }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_SERVER}/api/messages/received`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, channel, subject, body })
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => [data.message, ...prev])
        return data.message
      }
      throw new Error(data.error)
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const logCall = useCallback(async ({ leadId, notes, outcome }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_SERVER}/api/messages/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, notes, outcome })
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => [data.message, ...prev])
        return data.message
      }
      throw new Error(data.error)
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getMessageStats = useCallback(async (leadId) => {
    try {
      const res = await fetch(`${API_SERVER}/api/messages/stats/${leadId}`)
      const data = await res.json()
      if (data.success) {
        return data.stats
      }
      return null
    } catch {
      return null
    }
  }, [])

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
