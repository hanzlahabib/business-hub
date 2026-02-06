import { useState, useCallback, useEffect } from 'react'

const JSON_SERVER = 'http://localhost:3005'

const DEFAULT_COLUMNS = [
  { id: 'todo', name: 'To Do', color: '#6B7280' },
  { id: 'inprogress', name: 'In Progress', color: '#3B82F6' },
  { id: 'review', name: 'Review', color: '#F59E0B' },
  { id: 'done', name: 'Done', color: '#10B981' }
]

export function useTaskBoards() {
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchBoards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${JSON_SERVER}/taskBoards`)
      const data = await res.json()
      setBoards(data)
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createBoard = useCallback(async (boardData) => {
    setLoading(true)
    setError(null)
    try {
      const newBoard = {
        ...boardData,
        id: crypto.randomUUID(),
        columns: boardData.columns || DEFAULT_COLUMNS,
        createdAt: new Date().toISOString()
      }

      const res = await fetch(`${JSON_SERVER}/taskBoards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBoard)
      })
      const data = await res.json()
      setBoards(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const createBoardFromLead = useCallback(async (lead) => {
    const board = await createBoard({
      name: `${lead.name} Project`,
      leadId: lead.id,
      columns: DEFAULT_COLUMNS
    })

    // Update lead with linkedBoardId
    if (board) {
      await fetch(`${JSON_SERVER}/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedBoardId: board.id })
      })
    }

    return board
  }, [createBoard])

  const updateBoard = useCallback(async (id, updates) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${JSON_SERVER}/taskBoards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const data = await res.json()
      setBoards(prev => prev.map(b => b.id === id ? data : b))
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteBoard = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      // Delete all tasks in board first
      const tasksRes = await fetch(`${JSON_SERVER}/tasks?boardId=${id}`)
      const tasks = await tasksRes.json()

      for (const task of tasks) {
        await fetch(`${JSON_SERVER}/tasks/${task.id}`, { method: 'DELETE' })
      }

      // Delete board
      await fetch(`${JSON_SERVER}/taskBoards/${id}`, { method: 'DELETE' })
      setBoards(prev => prev.filter(b => b.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const addColumn = useCallback(async (boardId, column) => {
    const board = boards.find(b => b.id === boardId)
    if (!board) return null

    const newColumn = {
      id: column.id || crypto.randomUUID(),
      name: column.name,
      color: column.color || '#6B7280'
    }

    return updateBoard(boardId, {
      columns: [...board.columns, newColumn]
    })
  }, [boards, updateBoard])

  const removeColumn = useCallback(async (boardId, columnId) => {
    const board = boards.find(b => b.id === boardId)
    if (!board) return null

    return updateBoard(boardId, {
      columns: board.columns.filter(c => c.id !== columnId)
    })
  }, [boards, updateBoard])

  const getBoardById = useCallback((id) => {
    return boards.find(b => b.id === id)
  }, [boards])

  const getBoardByLeadId = useCallback((leadId) => {
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
