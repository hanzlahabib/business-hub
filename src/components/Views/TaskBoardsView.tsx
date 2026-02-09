import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    BoardList,
    TaskBoard,
    CreateBoardModal,
    BoardSettingsModal,
    TaskDetailPanel,
    useTaskBoards,
    useTasks
} from '../../modules/taskboards'
import { useLeads } from '../../modules/leads'

export function TaskBoardsView({ initialBoardId, onBoardViewed }: { initialBoardId?: string, onBoardViewed?: () => void }) {
    const { boardId } = useParams()
    const navigate = useNavigate()
    const { boards, createBoard, updateBoard, deleteBoard, getBoardById } = useTaskBoards()
    const { leads } = useLeads()

    // Get selected board from URL params
    const selectedBoard = useMemo(() => {
        if (!boardId) return null
        return getBoardById(boardId) || boards.find(b => b.id === boardId) || null
    }, [boardId, boards, getBoardById])

    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showSettingsModal, setShowSettingsModal] = useState(false)
    // const [addingToColumn, setAddingToColumn] = useState(null) // Unused state

    // Auto-select board when navigating from leads (legacy support for initialBoardId prop)
    useEffect(() => {
        if (initialBoardId && boards.length > 0) {
            const board = getBoardById(initialBoardId) || boards.find(b => b.id === initialBoardId)
            if (board) {
                navigate(`/taskboards/${board.id}`)
                onBoardViewed?.() // Clear the initialBoardId after viewing
            }
        }
    }, [initialBoardId, boards, getBoardById, onBoardViewed, navigate])

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

    const handleSelectBoard = (board: any) => {
        navigate(`/taskboards/${board.id}`)
    }

    const handleBackToList = () => {
        navigate('/taskboards')
        setSelectedTask(null)
    }

    const handleCreateBoard = async (boardData: any) => {
        await createBoard(boardData)
    }

    const handleTaskClick = (task: any) => {
        setSelectedTask(task)
    }

    const handleAddTask = async (columnId: string) => {
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

    const handleUpdateTask = async (taskId: string, updates: any) => {
        await updateTask(taskId, updates)
        // Update selected task if it's the one being changed
        if (selectedTask?.id === taskId) {
            setSelectedTask((prev: any) => ({ ...prev, ...updates }))
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        if (confirm('Delete this task?')) {
            await deleteTask(taskId)
            setSelectedTask(null)
        }
    }

    const handleUpdateBoard = async (boardId: string, updates: any) => {
        await updateBoard(boardId, updates)
        // Board will be updated via the boards state, no need to manually update selectedBoard
    }

    const handleDeleteBoard = async (boardId: string) => {
        await deleteBoard(boardId)
        navigate('/taskboards')
    }

    return (
        <div className="h-[calc(100vh-200px)]">
            {selectedBoard ? (
                <TaskBoard
                    board={selectedBoard}
                    onBack={handleBackToList}
                    onTaskClick={handleTaskClick}
                    onAddTask={handleAddTask}
                    onSettings={() => setShowSettingsModal(true)}
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

            {/* Board Settings Modal */}
            <BoardSettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                board={selectedBoard}
                onUpdate={handleUpdateBoard}
                onDelete={handleDeleteBoard}
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
