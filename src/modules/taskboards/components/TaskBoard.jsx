import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowLeft, Settings, MoreHorizontal } from 'lucide-react'
import TaskCard from './TaskCard'
import { useTasks } from '../hooks/useTasks'

function TaskColumn({ column, tasks, boardId, onTaskClick, onAddTask, onDrop }) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) {
      onDrop(taskId, column.id)
    }
  }

  return (
    <div
      className={`flex-1 min-w-[280px] max-w-[320px] flex flex-col bg-white/5 rounded-xl border transition-colors ${
        isDragOver ? 'border-white/30 bg-white/10' : 'border-white/10'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div
        className="p-3 rounded-t-xl border-b border-white/10"
        style={{ backgroundColor: `${column.color}20` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-medium text-white text-sm">{column.name}</h3>
            <span className="px-1.5 py-0.5 bg-white/10 rounded text-xs text-white/60">
              {tasks.length}
            </span>
          </div>
          <button
            onClick={() => onAddTask(column.id)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <Plus className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        <AnimatePresence>
          {tasks.map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('taskId', task.id)
              }}
            >
              <TaskCard
                task={task}
                onClick={onTaskClick}
              />
            </div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="text-center py-6 text-white/30 text-sm">
            <p>No tasks</p>
            <button
              onClick={() => onAddTask(column.id)}
              className="mt-1 text-xs text-blue-400 hover:text-blue-300"
            >
              Add task
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function TaskBoard({
  board,
  onBack,
  onTaskClick,
  onAddTask,
  onSettings
}) {
  const { tasks, moveTask, getTasksByColumn } = useTasks(board?.id)

  const tasksByColumn = useMemo(() => {
    const grouped = {}
    board?.columns?.forEach(col => {
      grouped[col.id] = getTasksByColumn(col.id)
    })
    return grouped
  }, [board, tasks, getTasksByColumn])

  const handleDrop = async (taskId, newColumnId) => {
    const columnTasks = tasksByColumn[newColumnId] || []
    const newPosition = columnTasks.length
    await moveTask(taskId, newColumnId, newPosition)
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full text-white/40">
        <p>Select a board to view tasks</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">{board.name}</h2>
            <p className="text-sm text-white/50">
              {tasks.length} tasks • {board.columns.length} columns
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddTask?.(board.columns[0]?.id)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
          <button
            onClick={onSettings}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="flex gap-4 h-full">
          {board.columns.map(column => (
            <TaskColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn[column.id] || []}
              boardId={board.id}
              onTaskClick={onTaskClick}
              onAddTask={onAddTask}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default TaskBoard
