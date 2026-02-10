// @ts-nocheck
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowLeft, Settings, Search, Filter, X, Tag, AlertCircle, Calendar, CheckSquare } from 'lucide-react'
import TaskCard from './TaskCard'
import { useTasks } from '../hooks/useTasks'
import GlobalSearch from './GlobalSearch'
import { SearchableSelect } from '../../../components/ui/searchable-select'

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
      className={`flex-1 min-w-[280px] max-w-[320px] flex flex-col bg-bg-secondary rounded-xl border transition-colors ${isDragOver ? 'border-accent-primary bg-bg-tertiary' : 'border-border'
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div
        className="p-3 rounded-t-xl border-b border-border"
        style={{ backgroundColor: `${column.color}20` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-medium text-text-primary text-sm">{column.name}</h3>
            <span className="px-1.5 py-0.5 bg-bg-tertiary rounded text-xs text-text-muted">
              {tasks.length}
            </span>
          </div>
          <button
            onClick={() => onAddTask(column.id)}
            className="p-1 hover:bg-bg-tertiary rounded transition-colors"
          >
            <Plus className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-350px)]">
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
          <div className="text-center py-6 text-text-muted text-sm">
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
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    priority: '',
    tag: '',
    hasDueDate: '',
    hasSubtasks: ''
  })

  // Get filter options
  const filterOptions = useMemo(() => {
    // Priorities
    const priorityCounts = {}
    tasks.forEach(t => {
      if (t.priority) {
        priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1
      }
    })
    const priorities = Object.entries(priorityCounts)
      .map(([value, count]) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1), count }))
      .sort((a, b) => b.count - a.count)

    // Tags
    const tagCounts = {}
    tasks.forEach(t => {
      (t.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    const tags = Object.entries(tagCounts)
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count)

    // Due date options
    const withDueDate = tasks.filter(t => t.dueDate).length
    const withoutDueDate = tasks.filter(t => !t.dueDate).length
    const dueDateOptions = [
      { value: 'yes', label: 'Has Due Date', count: withDueDate },
      { value: 'no', label: 'No Due Date', count: withoutDueDate }
    ].filter(o => o.count > 0)

    // Subtask options
    const withSubtasks = tasks.filter(t => t.subtasks?.length > 0).length
    const withoutSubtasks = tasks.filter(t => !t.subtasks?.length).length
    const subtaskOptions = [
      { value: 'yes', label: 'Has Subtasks', count: withSubtasks },
      { value: 'no', label: 'No Subtasks', count: withoutSubtasks }
    ].filter(o => o.count > 0)

    return { priorities, tags, dueDateOptions, subtaskOptions }
  }, [tasks])

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = tasks

    // Priority
    if (filters.priority) {
      result = result.filter(t => t.priority === filters.priority)
    }

    // Tag
    if (filters.tag) {
      result = result.filter(t => t.tags?.includes(filters.tag))
    }

    // Due date
    if (filters.hasDueDate === 'yes') {
      result = result.filter(t => t.dueDate)
    } else if (filters.hasDueDate === 'no') {
      result = result.filter(t => !t.dueDate)
    }

    // Subtasks
    if (filters.hasSubtasks === 'yes') {
      result = result.filter(t => t.subtasks?.length > 0)
    } else if (filters.hasSubtasks === 'no') {
      result = result.filter(t => !t.subtasks?.length)
    }

    return result
  }, [tasks, filters])

  const tasksByColumn = useMemo(() => {
    const grouped = {}
    board?.columns?.forEach(col => {
      grouped[col.id] = filteredTasks.filter(t => t.columnId === col.id)
    })
    return grouped
  }, [board, filteredTasks])

  const handleDrop = async (taskId, newColumnId) => {
    const columnTasks = tasksByColumn[newColumnId] || []
    const newPosition = columnTasks.length
    await moveTask(taskId, newColumnId, newPosition)
  }

  const clearFilters = () => {
    setFilters({ priority: '', tag: '', hasDueDate: '', hasSubtasks: '' })
  }

  // Keyboard shortcut: Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        <p>Select a board to view tasks</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-text-primary">{board.name}</h2>
              <p className="text-sm text-text-muted">
                <span className={filteredTasks.length !== tasks.length ? 'text-blue-400' : ''}>
                  {filteredTasks.length} of {tasks.length} tasks
                </span>
                {' • '}{(board.columns || []).length} columns
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Button (Ctrl+K) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg text-sm text-text-muted transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 bg-bg-tertiary rounded text-xs">Ctrl+K</kbd>
            </button>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${showFilters || activeFilterCount > 0
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-bg-secondary border-border text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onAddTask?.((board.columns || [])[0]?.id)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
            <button
              onClick={onSettings}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div className="bg-bg-secondary rounded-xl p-4 border border-border">
            <div className="flex items-start gap-6">
              {/* Filter Grid */}
              <div className="flex-1 grid grid-cols-4 gap-3">
                {/* Priority Filter */}
                <SearchableSelect
                  value={filters.priority}
                  onChange={(v) => setFilters(f => ({ ...f, priority: v }))}
                  options={filterOptions.priorities}
                  placeholder="All Priorities"
                  searchPlaceholder="Search..."
                  label="Priority"
                  icon={AlertCircle}
                />

                {/* Tag Filter */}
                <SearchableSelect
                  value={filters.tag}
                  onChange={(v) => setFilters(f => ({ ...f, tag: v }))}
                  options={filterOptions.tags}
                  placeholder="All Tags"
                  searchPlaceholder="Search tag..."
                  label="Tag"
                  icon={Tag}
                />

                {/* Due Date Filter */}
                <SearchableSelect
                  value={filters.hasDueDate}
                  onChange={(v) => setFilters(f => ({ ...f, hasDueDate: v }))}
                  options={filterOptions.dueDateOptions}
                  placeholder="Any Due Date"
                  searchPlaceholder="Search..."
                  label="Due Date"
                  icon={Calendar}
                />

                {/* Subtasks Filter */}
                <SearchableSelect
                  value={filters.hasSubtasks}
                  onChange={(v) => setFilters(f => ({ ...f, hasSubtasks: v }))}
                  options={filterOptions.subtaskOptions}
                  placeholder="Any Subtasks"
                  searchPlaceholder="Search..."
                  label="Subtasks"
                  icon={CheckSquare}
                />
              </div>

              {/* Clear Button */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 mt-5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <span className="text-xs text-text-muted">Active:</span>
                {filters.priority && (
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs flex items-center gap-1">
                    {filters.priority}
                    <X className="w-3 h-3 cursor-pointer hover:text-text-primary" onClick={() => setFilters(f => ({ ...f, priority: '' }))} />
                  </span>
                )}
                {filters.tag && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1">
                    {filters.tag}
                    <X className="w-3 h-3 cursor-pointer hover:text-text-primary" onClick={() => setFilters(f => ({ ...f, tag: '' }))} />
                  </span>
                )}
                {filters.hasDueDate && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
                    {filters.hasDueDate === 'yes' ? 'Has Due Date' : 'No Due Date'}
                    <X className="w-3 h-3 cursor-pointer hover:text-text-primary" onClick={() => setFilters(f => ({ ...f, hasDueDate: '' }))} />
                  </span>
                )}
                {filters.hasSubtasks && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs flex items-center gap-1">
                    {filters.hasSubtasks === 'yes' ? 'Has Subtasks' : 'No Subtasks'}
                    <X className="w-3 h-3 cursor-pointer hover:text-text-primary" onClick={() => setFilters(f => ({ ...f, hasSubtasks: '' }))} />
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="flex gap-4 h-full">
          {(board.columns || []).map(column => (
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

      {/* Global Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <GlobalSearch
            tasks={tasks}
            columns={board.columns || []}
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSelectTask={(task) => onTaskClick(task)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default TaskBoard
