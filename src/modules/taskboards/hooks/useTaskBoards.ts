import { useState, useCallback, useEffect } from 'react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import { getAuthHeaders, getJsonAuthHeaders, fetchGet, fetchMutation } from '../../../utils/authHeaders'

export interface Column {
  id: string
  name: string
  color: string
}

export interface TaskBoard {
  id: string
  name: string
  columns: Column[]
  leadId?: string
  createdAt: string
  tasks?: any[]
}

const DEFAULT_COLUMNS: Column[] = [
  { id: 'todo', name: 'To Do', color: '#6B7280' },
  { id: 'inprogress', name: 'In Progress', color: '#3B82F6' },
  { id: 'review', name: 'Review', color: '#F59E0B' },
  { id: 'done', name: 'Done', color: '#10B981' }
]

export function useTaskBoards() {
  const { user } = useAuth()
  const [boards, setBoards] = useState<TaskBoard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBoards = useCallback(async () => {
    if (!user) return []
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGet(ENDPOINTS.TEMPLATES.replace('templates', 'taskboards'))
      setBoards(Array.isArray(data) ? data : [])
      return data
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user])

  const createBoard = useCallback(async (boardData: Partial<TaskBoard>) => {
    if (!user) return null
    setLoading(true)
    setError(null)
    try {
      const newBoard = {
        ...boardData,
        columns: boardData.columns || DEFAULT_COLUMNS,
        createdAt: new Date().toISOString()
      }

      const data = await fetchMutation(ENDPOINTS.TEMPLATES.replace('templates', 'taskboards'), 'POST', newBoard)
      setBoards(prev => [...prev, data])
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const createBoardFromLead = useCallback(async (lead: any) => {
    const board = await createBoard({
      name: `${lead.name} Project`,
      leadId: lead.id,
      columns: DEFAULT_COLUMNS
    })

    if (board && user) {
      await fetchMutation(`${ENDPOINTS.LEADS}/${lead.id}`, 'PATCH', { linkedBoardId: board.id })
    }

    return board
  }, [createBoard, user])

  const updateBoard = useCallback(async (id: string, updates: Partial<TaskBoard>) => {
    if (!user) return null
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMutation(`${ENDPOINTS.TEMPLATES.replace('templates', 'taskboards')}/${id}`, 'PATCH', updates)
      setBoards(prev => prev.map(b => b.id === id ? data : b))
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const deleteBoard = useCallback(async (id: string) => {
    if (!user) return false
    setLoading(true)
    setError(null)
    try {
      await fetchMutation(`${ENDPOINTS.TEMPLATES.replace('templates', 'taskboards')}/${id}`, 'DELETE')
      setBoards(prev => prev.filter(b => b.id !== id))
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  const addColumn = useCallback(async (boardId: string, column: Partial<Column>) => {
    const board = boards.find(b => b.id === boardId)
    if (!board) return null

    const newColumn = {
      id: column.id || crypto.randomUUID(),
      name: column.name || 'New Column',
      color: column.color || '#6B7280'
    }

    return updateBoard(boardId, {
      columns: [...board.columns, newColumn]
    })
  }, [boards, updateBoard])

  const removeColumn = useCallback(async (boardId: string, columnId: string) => {
    const board = boards.find(b => b.id === boardId)
    if (!board) return null

    return updateBoard(boardId, {
      columns: board.columns.filter(c => c.id !== columnId)
    })
  }, [boards, updateBoard])

  const getBoardById = useCallback((id: string) => {
    return boards.find(b => b.id === id)
  }, [boards])

  const getBoardByLeadId = useCallback((leadId: string) => {
    return boards.find(b => b.leadId === leadId)
  }, [boards])

  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  return {
    boards,
    loading,
    error,
    defaultColumns: DEFAULT_COLUMNS,
    fetchBoards,
    createBoard,
    createBoardFromLead,
    updateBoard,
    deleteBoard,
    addColumn,
    removeColumn,
    getBoardById,
    getBoardByLeadId
  }
}


export default useTaskBoards
