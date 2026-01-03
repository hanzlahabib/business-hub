import { useReducer, useCallback, useMemo, memo, useState } from 'react'
import { Plus, Calendar, LayoutGrid, AlertTriangle, Clock, List, Clock3, Table2, Sun, Moon } from 'lucide-react'
import { useSchedule } from './hooks/useSchedule'
import { useTheme } from './hooks/useTheme'
import { WeekView } from './components/Calendar'
import { StatsBar } from './components/Dashboard'
import { AddContentModal, SettingsModal, VariantGuideModal } from './components/Forms'
import { BookOpen } from 'lucide-react'
import { Button } from './components/UI'
import { ListView, TimelineView, TableView } from './components/Views'
import { ContentDetailPanel } from './components/DetailPanel'
import { format, isPast, parseISO } from 'date-fns'

// App State Reducer
const initialState = {
  showAddModal: false,
  showSettingsModal: false,
  showVariantGuide: false,
  selectedDate: null,
  editingContent: null,
  detailContent: null,
  view: 'calendar'
}

function appReducer(state, action) {
  switch (action.type) {
    case 'OPEN_ADD_MODAL':
      return { ...state, showAddModal: true, selectedDate: action.date, editingContent: null }
    case 'OPEN_EDIT_MODAL':
      return { ...state, showAddModal: true, editingContent: action.content, selectedDate: action.content.scheduledDate, detailContent: null }
    case 'CLOSE_MODAL':
      return { ...state, showAddModal: false, editingContent: null }
    case 'OPEN_SETTINGS':
      return { ...state, showSettingsModal: true }
    case 'CLOSE_SETTINGS':
      return { ...state, showSettingsModal: false }
    case 'OPEN_VARIANT_GUIDE':
      return { ...state, showVariantGuide: true }
    case 'CLOSE_VARIANT_GUIDE':
      return { ...state, showVariantGuide: false }
    case 'SET_VIEW':
      return { ...state, view: action.view }
    case 'OPEN_DETAIL':
      return { ...state, detailContent: action.content }
    case 'CLOSE_DETAIL':
      return { ...state, detailContent: null }
    default:
      return state
  }
}

function App() {
  const {
    contents,
    settings,
    addContent,
    updateContent,
    deleteContent,
    moveToStatus,
    scheduleContent,
    getStats,
    getStreak,
    updateSettings,
    addComment,
    deleteComment,
    addUrl,
    removeUrl
  } = useSchedule()

  const { theme, toggleTheme } = useTheme()
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Memoized stats and streak
  const stats = useMemo(() => getStats(), [contents])
  const streak = useMemo(() => getStreak(), [contents])

  // Get last used video variant for auto-rotation
  const lastUsedVariant = useMemo(() => {
    const sortedContents = [...contents]
      .filter(c => c.videoVariant)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    return sortedContents[0]?.videoVariant || ''
  }, [contents])

  // Memoized handlers
  const handleAddContent = useCallback((date) => {
    dispatch({ type: 'OPEN_ADD_MODAL', date })
  }, [])

  const handleEditContent = useCallback((content) => {
    dispatch({ type: 'OPEN_EDIT_MODAL', content })
  }, [])

  const handleCloseModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' })
  }, [])

  const handleSaveContent = useCallback((contentData) => {
    if (state.editingContent) {
      updateContent(state.editingContent.id, contentData)
    } else {
      addContent(contentData)
    }
    dispatch({ type: 'CLOSE_MODAL' })
  }, [state.editingContent, updateContent, addContent])

  const handleDeleteContent = useCallback((id) => {
    if (window.confirm('Delete this content?')) {
      deleteContent(id)
    }
  }, [deleteContent])

  const handleViewChange = useCallback((view) => {
    dispatch({ type: 'SET_VIEW', view })
  }, [])

  const handleOpenSettings = useCallback(() => {
    dispatch({ type: 'OPEN_SETTINGS' })
  }, [])

  const handleCloseSettings = useCallback(() => {
    dispatch({ type: 'CLOSE_SETTINGS' })
  }, [])

  const handleSaveSettings = useCallback((newSettings) => {
    updateSettings(newSettings)
  }, [updateSettings])

  const handleOpenVariantGuide = useCallback(() => {
    dispatch({ type: 'OPEN_VARIANT_GUIDE' })
  }, [])

  const handleCloseVariantGuide = useCallback(() => {
    dispatch({ type: 'CLOSE_VARIANT_GUIDE' })
  }, [])

  const handleOpenDetail = useCallback((content) => {
    dispatch({ type: 'OPEN_DETAIL', content })
  }, [])

  const handleCloseDetail = useCallback(() => {
    dispatch({ type: 'CLOSE_DETAIL' })
  }, [])

  const handleEditFromDetail = useCallback((content) => {
    dispatch({ type: 'CLOSE_DETAIL' })
    dispatch({ type: 'OPEN_EDIT_MODAL', content })
  }, [])

  const handleUpdateContentFromDetail = useCallback((contentData) => {
    updateContent(contentData.id, contentData)
  }, [updateContent])

  const handleUpdateStatus = useCallback((id, newStatus) => {
    moveToStatus(id, newStatus)
  }, [moveToStatus])

  // Keep detail content in sync with contents array
  const currentDetailContent = useMemo(() => {
    if (!state.detailContent) return null
    return contents.find(c => c.id === state.detailContent.id) || null
  }, [state.detailContent, contents])

  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], [])

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <Header
          view={state.view}
          onViewChange={handleViewChange}
          onAddContent={() => handleAddContent(todayDate)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenVariantGuide={handleOpenVariantGuide}
        />

        {/* Stats Bar */}
        <div className="mb-6">
          <StatsBar stats={stats} streak={streak} onOpenSettings={handleOpenSettings} goalsEnabled={settings.goalsEnabled !== false} />
        </div>

        {/* Main Content */}
        <main className="bg-bg-secondary/50 rounded-2xl border border-border p-6">
          {state.view === 'calendar' && (
            <WeekView
              contents={contents}
              onAddContent={handleAddContent}
              onEditContent={handleEditContent}
              onDeleteContent={handleDeleteContent}
              onDateChange={scheduleContent}
              onOpenDetail={handleOpenDetail}
            />
          )}
          {state.view === 'pipeline' && (
            <PipelineView
              contents={contents}
              onEditContent={handleEditContent}
              onStatusChange={moveToStatus}
            />
          )}
          {state.view === 'list' && (
            <ListView
              contents={contents}
              onEdit={handleEditContent}
              onDelete={handleDeleteContent}
              onOpenDetail={handleOpenDetail}
            />
          )}
          {state.view === 'timeline' && (
            <TimelineView
              contents={contents}
              onEdit={handleEditContent}
              onSchedule={scheduleContent}
              onOpenDetail={handleOpenDetail}
            />
          )}
          {state.view === 'table' && (
            <TableView
              contents={contents}
              onEdit={handleEditContent}
              onUpdateStatus={handleUpdateStatus}
              onOpenDetail={handleOpenDetail}
            />
          )}
        </main>

        {/* Add/Edit Modal */}
        <AddContentModal
          isOpen={state.showAddModal}
          onClose={handleCloseModal}
          onAdd={handleSaveContent}
          initialDate={state.selectedDate}
          editContent={state.editingContent}
          onAddComment={addComment}
          onDeleteComment={deleteComment}
          topics={settings.topics}
          videoVariants={settings.videoVariants}
          lastUsedVariant={lastUsedVariant}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={state.showSettingsModal}
          onClose={handleCloseSettings}
          settings={settings}
          onSave={handleSaveSettings}
        />

        {/* Variant Guide Modal */}
        <VariantGuideModal
          isOpen={state.showVariantGuide}
          onClose={handleCloseVariantGuide}
        />

        {/* Content Detail Panel */}
        <ContentDetailPanel
          content={currentDetailContent}
          isOpen={!!currentDetailContent}
          onClose={handleCloseDetail}
          onEdit={handleEditFromDetail}
          onAddComment={addComment}
          onDeleteComment={deleteComment}
          onAddUrl={addUrl}
          onRemoveUrl={removeUrl}
          onUpdateContent={handleUpdateContentFromDetail}
        />
      </div>
    </div>
  )
}

// Memoized Header Component
const Header = memo(function Header({ view, onViewChange, onAddContent, theme, onToggleTheme, onOpenVariantGuide }) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
          <Calendar size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Code with Hanzla</h1>
          <p className="text-sm text-text-muted">Content Schedule</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Variants Guide */}
        <button
          onClick={onOpenVariantGuide}
          className="p-2.5 rounded-xl bg-bg-secondary border border-border text-text-muted hover:text-accent-primary hover:border-accent-primary transition-colors flex items-center gap-2"
          title="Video Variants Guide"
        >
          <BookOpen size={18} />
          <span className="text-sm hidden sm:inline">Variants</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-bg-secondary border border-border text-text-muted hover:text-text-primary hover:border-accent-primary transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Calendar Views */}
        <div className="flex items-center bg-bg-secondary rounded-xl border border-border p-1">
          <button
            onClick={() => onViewChange('calendar')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              view === 'calendar'
                ? 'bg-accent-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Calendar size={16} className="inline mr-1.5" />
            Calendar
          </button>
          <button
            onClick={() => onViewChange('pipeline')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              view === 'pipeline'
                ? 'bg-accent-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <LayoutGrid size={16} className="inline mr-1.5" />
            Pipeline
          </button>
          <button
            onClick={() => onViewChange('timeline')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              view === 'timeline'
                ? 'bg-accent-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Clock3 size={16} className="inline mr-1.5" />
            Timeline
          </button>
        </div>

        {/* Data Views */}
        <div className="flex items-center bg-bg-secondary rounded-xl border border-border p-1">
          <button
            onClick={() => onViewChange('list')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              view === 'list'
                ? 'bg-accent-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <List size={16} className="inline mr-1.5" />
            List
          </button>
          <button
            onClick={() => onViewChange('table')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              view === 'table'
                ? 'bg-accent-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Table2 size={16} className="inline mr-1.5" />
            Table
          </button>
        </div>

        <Button onClick={onAddContent}>
          <Plus size={18} />
          Add Content
        </Button>
      </div>
    </header>
  )
})

// Pipeline Card Component with Late Indicator
const PipelineCard = memo(function PipelineCard({
  content,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick
}) {
  const isLate = useMemo(() => {
    if (!content.scheduledDate || content.status === 'published') return false
    return isPast(parseISO(content.scheduledDate + 'T23:59:59'))
  }, [content.scheduledDate, content.status])

  const formattedDate = useMemo(() => {
    if (!content.scheduledDate) return null
    return format(parseISO(content.scheduledDate), 'MMM d')
  }, [content.scheduledDate])

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`
        p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all
        ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'}
        ${content.type === 'long'
          ? 'bg-accent-secondary/10 border-accent-secondary/30'
          : 'bg-accent-primary/10 border-accent-primary/30'
        }
        ${isLate ? 'ring-2 ring-accent-danger/50' : ''}
      `}
    >
      <p className="text-sm font-medium text-text-primary truncate">
        {content.title || 'Untitled'}
      </p>

      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <span className="text-xs text-text-muted">
          {content.type === 'long' ? '🎬 Long' : '📱 Short'}
        </span>

        {formattedDate && (
          <span className={`text-xs flex items-center gap-1 ${isLate ? 'text-accent-danger' : 'text-text-muted'}`}>
            <Clock size={10} />
            {formattedDate}
          </span>
        )}

        {isLate && (
          <span className="text-xs bg-accent-danger/20 text-accent-danger px-1.5 py-0.5 rounded flex items-center gap-1">
            <AlertTriangle size={10} />
            LATE
          </span>
        )}
      </div>

      {content.topic && (
        <p className="text-xs text-text-muted/70 mt-1 truncate">{content.topic}</p>
      )}
    </div>
  )
})

// Pipeline View with proper hooks
const PipelineView = memo(function PipelineView({ contents, onEditContent, onStatusChange }) {
  const [dragState, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'DRAG_START':
          return { draggedItem: action.item, dragOverStage: null }
        case 'DRAG_OVER':
          return { ...state, dragOverStage: action.stageId }
        case 'DRAG_END':
          return { draggedItem: null, dragOverStage: null }
        default:
          return state
      }
    },
    { draggedItem: null, dragOverStage: null }
  )

  const stages = useMemo(() => [
    { id: 'idea', label: 'Ideas', color: 'text-text-muted', bg: 'bg-gray-500/20' },
    { id: 'script', label: 'Script', color: 'text-accent-warning', bg: 'bg-accent-warning/20' },
    { id: 'recording', label: 'Recording', color: 'text-accent-primary', bg: 'bg-accent-primary/20' },
    { id: 'editing', label: 'Editing', color: 'text-accent-secondary', bg: 'bg-accent-secondary/20' },
    { id: 'thumbnail', label: 'Thumbnail', color: 'text-orange-500', bg: 'bg-orange-500/20' },
    { id: 'published', label: 'Published', color: 'text-accent-success', bg: 'bg-accent-success/20' }
  ], [])

  const contentsByStage = useMemo(() => {
    const grouped = {}
    stages.forEach(stage => {
      grouped[stage.id] = contents.filter(c => c.status === stage.id)
    })
    return grouped
  }, [contents, stages])

  const handleDragStart = useCallback((content) => (e) => {
    dispatch({ type: 'DRAG_START', item: content })
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((stageId) => (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    dispatch({ type: 'DRAG_OVER', stageId })
  }, [])

  const handleDragLeave = useCallback(() => {
    dispatch({ type: 'DRAG_OVER', stageId: null })
  }, [])

  const handleDrop = useCallback((stageId) => (e) => {
    e.preventDefault()
    if (dragState.draggedItem && dragState.draggedItem.status !== stageId) {
      onStatusChange(dragState.draggedItem.id, stageId)
    }
    dispatch({ type: 'DRAG_END' })
  }, [dragState.draggedItem, onStatusChange])

  const handleDragEnd = useCallback(() => {
    dispatch({ type: 'DRAG_END' })
  }, [])

  const handleCardClick = useCallback((content) => () => {
    onEditContent(content)
  }, [onEditContent])

  return (
    <div className="grid grid-cols-6 gap-4">
      {stages.map(stage => {
        const stageContents = contentsByStage[stage.id]
        const isDragOver = dragState.dragOverStage === stage.id
        const lateCount = stageContents.filter(c => {
          if (!c.scheduledDate || c.status === 'published') return false
          return isPast(parseISO(c.scheduledDate + 'T23:59:59'))
        }).length

        return (
          <div
            key={stage.id}
            onDragOver={handleDragOver(stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop(stage.id)}
            className={`
              rounded-xl p-3 min-h-[400px] transition-all duration-200
              ${isDragOver
                ? `${stage.bg} border-2 border-dashed border-current scale-[1.02]`
                : 'bg-bg-tertiary/30 border-2 border-transparent'
              }
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold ${stage.color}`}>{stage.label}</h3>
              <div className="flex items-center gap-1">
                {lateCount > 0 && (
                  <span className="text-xs bg-accent-danger/20 text-accent-danger px-1.5 py-0.5 rounded">
                    {lateCount} late
                  </span>
                )}
                <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">
                  {stageContents.length}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {stageContents.map(content => (
                <PipelineCard
                  key={content.id}
                  content={content}
                  isDragging={dragState.draggedItem?.id === content.id}
                  onDragStart={handleDragStart(content)}
                  onDragEnd={handleDragEnd}
                  onClick={handleCardClick(content)}
                />
              ))}
              {stageContents.length === 0 && (
                <p className={`text-xs text-center py-8 ${isDragOver ? stage.color : 'text-text-muted'}`}>
                  {isDragOver ? 'Drop here!' : 'No content'}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
})

export default App
