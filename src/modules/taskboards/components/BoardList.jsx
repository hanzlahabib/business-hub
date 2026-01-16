import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LayoutGrid, Calendar, Users, Trash2, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { useTaskBoards } from '../hooks/useTaskBoards'

function BoardCard({ board, onClick, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick(board)}
      className="group relative cursor-pointer bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all"
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(board.id)
        }}
        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
      >
        <Trash2 className="w-4 h-4 text-red-400" />
      </button>

      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-4">
        <LayoutGrid className="w-6 h-6 text-blue-400" />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-white mb-1 pr-8">{board.name}</h3>

      {/* Lead link */}
      {board.leadId && (
        <div className="flex items-center gap-1 text-xs text-purple-400 mb-2">
          <Users className="w-3 h-3" />
          <span>Linked to lead</span>
        </div>
      )}

      {/* Columns preview */}
      <div className="flex gap-1 mb-3">
        {board.columns?.slice(0, 4).map(col => (
          <div
            key={col.id}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: col.color }}
            title={col.name}
          />
        ))}
        {board.columns?.length > 4 && (
          <span className="text-[10px] text-white/40">+{board.columns.length - 4}</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 text-xs text-white/40">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{format(new Date(board.createdAt), 'MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-1">
          <LayoutGrid className="w-3 h-3" />
          <span>{board.columns?.length || 0} columns</span>
        </div>
      </div>
    </motion.div>
  )
}

export function BoardList({ onSelectBoard, onCreateBoard }) {
  const { boards, loading, deleteBoard } = useTaskBoards()

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this board and all its tasks?')) {
      await deleteBoard(id)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white">Task Boards</h2>
          <p className="text-sm text-white/50">{boards.length} boards</p>
        </div>

        <button
          onClick={onCreateBoard}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Board
        </button>
      </div>

      {/* Board Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="w-12 h-12 bg-white/10 rounded-xl mb-4" />
                <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <LayoutGrid className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No boards yet</h3>
            <p className="text-sm text-white/50 mb-4 max-w-sm">
              Create your first board to start organizing tasks. You can also create boards from leads.
            </p>
            <button
              onClick={onCreateBoard}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Board
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {boards.map(board => (
                <BoardCard
                  key={board.id}
                  board={board}
                  onClick={onSelectBoard}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

export default BoardList
