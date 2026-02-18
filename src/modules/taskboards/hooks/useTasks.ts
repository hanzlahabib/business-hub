import { useState, useCallback, useEffect } from 'react'
import { ENDPOINTS } from '../../../config/api'
import { useAuth } from '../../../hooks/useAuth'
import { fetchGet, fetchMutation } from '../../../utils/authHeaders'

export interface Subtask {
  id: string
  text: string
  done: boolean
}

export interface Task {
  id: string
  boardId: string
  columnId: string
  title: string
  description?: string
  position: number
  priority: 'low' | 'medium' | 'high'
  subtasks: Subtask[]
  createdAt: string
  dueDate?: string | null
  userId: string
}

export function useTasks(boardId: string | null = null) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async (bId?: string) => {
    const targetBoardId = bId || boardId
    if (!targetBoardId || !user) return []

    setLoading(true)
    setError(null)
    try {
      const data = await fetchGet(`${ENDPOINTS.TASKS}?boardId=${targetBoardId}`)
      const sortedData = (Array.isArray(data) ? data : []).sort((a: any, b: any) => a.position - b.position)
      setTasks(sortedData)
      return sortedData
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [boardId, user])

  const createTask = useCallback(async (taskData: Partial<Task>) => {
    if (!user) return null
    setLoading(true)
    setError(null)
    try {
      const columnTasks = tasks.filter(t => t.columnId === taskData.columnId)
      const maxPosition = columnTasks.length > 0
        ? Math.max(...columnTasks.map(t => t.position || 0))
        : -1

      const newTask = {
        ...taskData,
        subtasks: taskData.subtasks || [],
        priority: taskData.priority || 'medium',
        createdAt: new Date().toISOString(),
        position: maxPosition + 1
      }

      const data = await fetchMutation(ENDPOINTS.TASKS, 'POST', newTask)
      setTasks(prev => [...prev, data])
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [tasks, user])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!user) return null
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMutation(`${ENDPOINTS.TASKS}/${id}`, 'PATCH', updates)
      setTasks(prev => prev.map(t => t.id === id ? data : t))
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const deleteTask = useCallback(async (id: string) => {
    if (!user) return false
    setLoading(true)
    setError(null)
    try {
      await fetchMutation(`${ENDPOINTS.TASKS}/${id}`, 'DELETE')
      setTasks(prev => prev.filter(t => t.id !== id))
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  const moveTask = useCallback(async (taskId: string, newColumnId: string, newPosition: number) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return null

    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          return { ...t, columnId: newColumnId, position: newPosition }
        }
        return t
      })
      return updated.sort((a, b) => a.position - b.position)
    })

    return updateTask(taskId, { columnId: newColumnId, position: newPosition })
  }, [tasks, updateTask])

  const reorderTasks = useCallback(async (columnId: string, orderedTaskIds: string[]) => {
    if (!user) return
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

    for (const update of updates) {
      await fetchMutation(`${ENDPOINTS.TASKS}/${update.id}`, 'PATCH', { position: update.position })
    }
  }, [user])

  const addSubtask = useCallback(async (taskId: string, subtaskText: string) => {
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

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return null

    const updatedSubtasks = (task.subtasks || []).map(st =>
      st.id === subtaskId ? { ...st, done: !st.done } : st
    )

    return updateTask(taskId, { subtasks: updatedSubtasks })
  }, [tasks, updateTask])

  const deleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return null

    return updateTask(taskId, {
      subtasks: (task.subtasks || []).filter(st => st.id !== subtaskId)
    })
  }, [tasks, updateTask])

  const getTasksByColumn = useCallback((columnId: string) => {
    return tasks
      .filter(t => t.columnId === columnId)
      .sort((a, b) => a.position - b.position)
  }, [tasks])

  const getTaskById = useCallback((id: string) => {
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
