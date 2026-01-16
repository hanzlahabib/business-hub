import { useState } from 'react'
import {
  BoardList,
  TaskBoard,
  CreateBoardModal,
  TaskDetailPanel,
  useTaskBoards,
  useTasks
} from '../../modules/taskboards'
import { useLeads } from '../../modules/leads'

export function TaskBoardsView() {
  const { boards, createBoard, deleteBoard } = useTaskBoards()
  const { leads } = useLeads()

  const [selectedBoard, setSelectedBoard] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [addingToColumn, setAddingToColumn] = useState(null)

  // Task operations for selected board
  const {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask
  } = useTasks(selectedBoard?.id)

  const handleSelectBoard = (board) => {
    setSelectedBoard(board)
  }

  const handleBackToList = () => {
    setSelectedBoard(null)
    setSelectedTask(null)
  }

  const handleCreateBoard = async (boardData) => {
    await createBoard(boardData)
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
  }

  const handleAddTask = async (columnId) => {
    // Quick add - create task with default values
    const task = await createTask({
      boardId: selectedBoard.id,
      columnId,
      title: 'New Task',
      description: '',
      priority: 'medium',
      dueDate: null
    })

    if (task) {
      setSelectedTask(task)
    }
  }

  const handleUpdateTask = async (taskId, updates) => {
    await updateTask(taskId, updates)
    // Update selected task if it's the one being changed
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => ({ ...prev, ...updates }))
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (confirm('Delete this task?')) {
      await deleteTask(taskId)
      setSelectedTask(null)
    }
  }

  return (
    <div className="h-[calc(100vh-200px)]">
      {selectedBoard ? (
        <TaskBoard
          board={selectedBoard}
          onBack={handleBackToList}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
          onSettings={() => {}}
        />
      ) : (
        <BoardList
          onSelectBoard={handleSelectBoard}
          onCreateBoard={() => setShowCreateModal(true)}
        />
      )}

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateBoard}
        leads={leads}
      />

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onAddSubtask={addSubtask}
        onToggleSubtask={toggleSubtask}
        onDeleteSubtask={deleteSubtask}
        columns={selectedBoard?.columns || []}
      />
    </div>
  )
}

export default TaskBoardsView
