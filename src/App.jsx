import { useReducer, useCallback, useMemo, memo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { Plus, Calendar, List, Sun, Moon } from 'lucide-react'
import { useSchedule } from './hooks/useSchedule'
import { useCalendarItems } from './hooks/useCalendarItems'
import { useTheme } from './hooks/useTheme'
import { useConfirmDialog } from './hooks/useConfirmDialog'
import { WeekView, CalendarFilters } from './components/Calendar'
import { AddContentModal } from './components/Forms'
import { Button, AlertDialog } from './components/UI'
import { ListView, LeadsView, TaskBoardsView, JobsView, TemplatesView } from './components/Views'
import { ContentDetailPanel } from './components/DetailPanel'
import { Sidebar, SidebarToggleButton } from './shared/components/Sidebar'
import { SkillMasteryView } from './modules/skillMastery'
import { ContentStudioView } from './modules/contentStudio'
import { getModuleFromPath, getViewFromPath, getViewRoute } from './routes'

// App State Reducer - activeModule and view are now derived from URL
const initialState = {
  showAddModal: false,
  selectedDate: null,
  editingContent: null,
  detailContent: null
}

function appReducer(state, action) {
  switch (action.type) {
    case 'OPEN_ADD_MODAL':
      return { ...state, showAddModal: true, selectedDate: action.date, editingContent: null }
    case 'OPEN_EDIT_MODAL':
      return { ...state, showAddModal: true, editingContent: action.content, selectedDate: action.content.scheduledDate, detailContent: null }
    case 'CLOSE_MODAL':
      return { ...state, showAddModal: false, editingContent: null }
    case 'OPEN_DETAIL':
      return { ...state, detailContent: action.content }
    case 'CLOSE_DETAIL':
      return { ...state, detailContent: null }
    default:
      return state
  }
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()

  // Derive activeModule and view from URL
  const activeModule = getModuleFromPath(location.pathname)
  const view = activeModule === 'schedule' ? getViewFromPath(location.pathname) : 'calendar'

  const {
    contents,
    settings,
    addContent,
    updateContent,
    deleteContent,
    scheduleContent,
    addComment,
    deleteComment,
    addUrl,
    removeUrl
  } = useSchedule()

  const { theme, toggleTheme } = useTheme()
  const { dialogState, confirm, close: closeDialog } = useConfirmDialog()
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Calendar filters state - only contents enabled by default
  const [calendarFilters, setCalendarFilters] = useState({
    contents: true,
    tasks: false,
    jobs: false,
    leads: false,
    milestones: false
  })

  // Fetch calendar items based on filters
  const { items: calendarItems, rescheduleItem } = useCalendarItems(calendarFilters)

  // Sidebar state - open by default on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), [])
  const toggleSidebarCollapse = useCallback(() => setSidebarCollapsed(prev => !prev), [])

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

  const handleDeleteContent = useCallback(async (id) => {
    const confirmed = await confirm({
      title: 'Delete Content',
      message: 'Are you sure you want to delete this content? This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })
    if (confirmed) {
      deleteContent(id)
    }
  }, [deleteContent, confirm])

  const handleViewChange = useCallback((newView) => {
    navigate(getViewRoute(newView))
  }, [navigate])

  // State for navigating to a specific board from leads
  const [navigateToBoardId, setNavigateToBoardId] = useState(null)

  const handleNavigateToBoard = useCallback((boardId) => {
    setNavigateToBoardId(boardId)
    navigate(`/taskboards/${boardId}`)
  }, [navigate])

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

  // Handle calendar filter changes
  const handleCalendarFilterChange = useCallback((newFilters) => {
    setCalendarFilters(newFilters)
  }, [])

  // Handle calendar item date change (drag and drop)
  const handleItemDateChange = useCallback(async (item, newDate) => {
    const success = await rescheduleItem(item, newDate)
    if (success) {
      toast.success(`${item.title} moved to ${newDate}`)
    } else {
      toast.error('Failed to reschedule item')
    }
  }, [rescheduleItem])

  // Handle calendar item click - navigate to appropriate module
  const handleCalendarItemClick = useCallback((item) => {
    switch (item.module) {
      case 'schedule':
        // Open content detail
        handleOpenDetail(item.sourceData)
        break
      case 'taskboards':
        // Navigate to taskboards with the board
        if (item.boardId) {
          setNavigateToBoardId(item.boardId)
          navigate(`/taskboards/${item.boardId}`)
        } else {
          navigate('/taskboards')
        }
        break
      case 'jobs':
        navigate('/jobs')
        break
      case 'leads':
        navigate('/leads')
        break
      case 'skillmastery':
        navigate('/skillmastery')
        break
      default:
        break
    }
  }, [navigate, handleOpenDetail])

  // Keep detail content in sync with contents array
  const currentDetailContent = useMemo(() => {
    if (!state.detailContent) return null
    return contents.find(c => c.id === state.detailContent.id) || null
  }, [state.detailContent, contents])

  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], [])

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Sidebar - always rendered, positioned off-screen on mobile when closed */}
      <Sidebar
        activeModule={activeModule}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        isCollapsed={sidebarCollapsed}
        onCollapse={toggleSidebarCollapse}
      />

      {/* Main content area - add padding for desktop sidebar */}
      <div className={`${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-52'} transition-all duration-300`}>
        <div className="p-6">
          <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <Header
              theme={theme}
              onToggleTheme={toggleTheme}
              onToggleSidebar={toggleSidebar}
            />

            {/* Content Studio Module - Self-contained with its own UI */}
            {activeModule === 'contentstudio' && <ContentStudioView />}

            {/* Calendar Module - Clean unified scheduling */}
            {activeModule === 'schedule' && (
              <main className="bg-bg-secondary/50 rounded-2xl border border-border p-6">
                {/* Calendar Module Toolbar */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                  {/* View Switcher - Calendar and List only */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewChange('calendar')}
                      className={`px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                        view === 'calendar'
                          ? 'bg-accent-primary text-white'
                          : 'bg-bg-secondary text-text-muted hover:text-text-primary border border-border'
                      }`}
                    >
                      <Calendar size={14} />
                      <span>Calendar</span>
                    </button>
                    <button
                      onClick={() => handleViewChange('list')}
                      className={`px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                        view === 'list'
                          ? 'bg-accent-primary text-white'
                          : 'bg-bg-secondary text-text-muted hover:text-text-primary border border-border'
                      }`}
                    >
                      <List size={14} />
                      <span>List</span>
                    </button>
                  </div>

                  {/* Calendar/List Item Filters */}
                  <CalendarFilters
                    filters={calendarFilters}
                    onChange={handleCalendarFilterChange}
                  />

                  {/* Add Item Button */}
                  <Button onClick={() => handleAddContent(todayDate)}>
                    <Plus size={16} />
                    <span className="text-xs">Add Item</span>
                  </Button>
                </div>

                {view === 'calendar' && (
                  <WeekView
                    contents={contents}
                    items={calendarItems}
                    calendarFilters={calendarFilters}
                    onAddContent={handleAddContent}
                    onEditContent={handleEditContent}
                    onDeleteContent={handleDeleteContent}
                    onDateChange={scheduleContent}
                    onItemDateChange={handleItemDateChange}
                    onOpenDetail={handleOpenDetail}
                    onItemClick={handleCalendarItemClick}
                  />
                )}
                {view === 'list' && (
                  <ListView
                    contents={contents}
                    items={calendarItems}
                    calendarFilters={calendarFilters}
                    onEdit={handleEditContent}
                    onDelete={handleDeleteContent}
                    onOpenDetail={handleOpenDetail}
                    onItemClick={handleCalendarItemClick}
                  />
                )}
              </main>
            )}

            {/* Leads Module */}
            {activeModule === 'leads' && (
              <main className="bg-bg-secondary/50 rounded-2xl border border-border p-6">
                <LeadsView onNavigateToBoard={handleNavigateToBoard} />
              </main>
            )}

            {/* Task Boards Module */}
            {activeModule === 'taskboards' && (
              <main className="bg-bg-secondary/50 rounded-2xl border border-border p-6">
                <TaskBoardsView
                  initialBoardId={navigateToBoardId}
                  onBoardViewed={() => setNavigateToBoardId(null)}
                />
              </main>
            )}

            {/* Jobs Module */}
            {activeModule === 'jobs' && (
              <main className="bg-bg-secondary/50 rounded-2xl border border-border p-6">
                <JobsView />
              </main>
            )}

            {/* Templates Module */}
            {activeModule === 'templates' && (
              <main className="bg-bg-secondary/50 rounded-2xl border border-border p-6">
                <TemplatesView />
              </main>
            )}

            {/* Skill Mastery Module */}
            {activeModule === 'skillmastery' && (
              <main className="bg-bg-secondary/50 rounded-2xl border border-border p-6">
                <SkillMasteryView />
              </main>
            )}

            {/* Add/Edit Modal - Only for Calendar module quick add */}
            {activeModule === 'schedule' && (
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
            )}

            {/* Content Detail Panel - Only for Calendar module */}
            {activeModule === 'schedule' && (
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
            )}

            {/* Alert Dialog for confirmations */}
            <AlertDialog
              {...dialogState}
              onClose={closeDialog}
            />

            {/* Toast notifications */}
            <Toaster
              position="bottom-right"
              theme="dark"
              richColors
              closeButton
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Memoized Header Component
const Header = memo(function Header({ theme, onToggleTheme, onToggleSidebar }) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle Button */}
        <SidebarToggleButton onClick={onToggleSidebar} />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Business Hub</h1>
            <p className="text-sm text-text-muted">Productivity Platform</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-bg-secondary border border-border text-text-muted hover:text-text-primary hover:border-accent-primary transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
})

export default App
