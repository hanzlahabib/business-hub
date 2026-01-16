import { useState, useCallback, useEffect } from 'react'

const JSON_SERVER = 'http://localhost:3001'

export function useTasks(boardId = null) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async (bId) => {
    const targetBoardId = bId || boardId
    if (!targetBoardId) return []

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${JSON_SERVER}/tasks?boardId=${targetBoardId}`)
      const data = await res.json()
      // Sort by position
      data.sort((a, b) => a.position - b.position)
      setTasks(data)
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [boardId])

  const createTask = useCallback(async (taskData) => {
    setLoading(true)
    setError(null)
    try {
      // Get max position in column
      const columnTasks = tasks.filter(t => t.columnId === taskData.columnId)
      const maxPosition = columnTasks.length > 0
        ? Math.max(...columnTasks.map(t => t.position || 0))
        : -1

      const newTask = {
        ...taskData,
        id: crypto.randomUUID(),
        subtasks: taskData.subtasks || [],
        priority: taskData.priority || 'medium',
        createdAt: new Date().toISOString(),
        position: maxPosition + 1
      }

      const res = await fetch(`${JSON_SERVER}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      })
      const data = await res.json()
      setTasks(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [tasks])

  const updateTask = useCallback(async (id, updates) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${JSON_SERVER}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const data = await res.json()
      setTasks(prev => prev.map(t => t.id === id ? data : t))
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTask = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      await fetch(`${JSON_SERVER}/tasks/${id}`, { method: 'DELETE' })
      setTasks(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const moveTask = useCallback(async (taskId, newColumnId, newPosition) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return null

    // Update local state immediately for smooth UX
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          return { ...t, columnId: newColumnId, position: newPosition }
        }
        return t
      })
      return updated.sort((a, b) => a.position - b.position)
    })

    // Persist to server
    return updateTask(taskId, { columnId: newColumnId, position: newPosition })
  }, [tasks, updateTask])

  const reorderTasks = useCallback(async (columnId, orderedTaskIds) => {
    // Update positions locally
    const updates = orderedTaskIds.map((id, index) => ({ id, position: index }))

    setTasks(prev => {
      return prev.map(t => {
        const update = updates.find(u => u.id === t.id)
        if (update) {
          return { ...t, position: update.position }
        }
        return t
      }).sort((a, b) => a.position - b.position)
    })

    // Persist to server
    for (const update of updates) {
      await fetch(`${JSON_SERVER}/tasks/${update.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: update.position })
      })
    }
  }, [])

  // Subtask operations
  const addSubtask = useCallback(async (taskId, subtaskText) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return null

    const newSubtask = {
      id: crypto.randomUUID(),
      text: subtaskText,
      done: false
    }

    return updateTask(taskId, {
      subtasks: [...(task.subtasks || []), newSubtask]
    })
  }, [tasks, updateTask])

  const toggleSubtask = useCallback(async (taskId, subtaskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return null

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, done: !st.done } : st
    )

    return updateTask(taskId, { subtasks: updatedSubtasks })
  }, [tasks, updateTask])

  const deleteSubtask = useCallback(async (taskId, subtaskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return null

    return updateTask(taskId, {
      subtasks: task.subtasks.filter(st => st.id !== subtaskId)
    })
  }, [tasks, updateTask])

  const getTasksByColumn = useCallback((columnId) => {
    return tasks
      .filter(t => t.columnId === columnId)
      .sort((a, b) => a.position - b.position)
  }, [tasks])

  const getTaskById = useCallback((id) => {
    return tasks.find(t => t.id === id)
  }, [tasks])

  useEffect(() => {
    if (boardId) {
      fetchTasks(boardId)
    }
  }, [boardId, fetchTasks])

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    reorderTasks,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    getTasksByColumn,
    getTaskById
  }
}

export default useTasks
