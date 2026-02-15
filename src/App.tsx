import { useReducer, useCallback, useMemo, useState, lazy, Suspense } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { Plus, Calendar, List } from 'lucide-react'
import { useSchedule, type Content } from './hooks/useSchedule'
import { useCalendarItems, type CalendarFilters as CalendarFiltersType, type CalendarItem } from './hooks/useCalendarItems'
import { useTheme } from './hooks/useTheme'
import { useConfirmDialog } from './hooks/useConfirmDialog'
import { WeekView, CalendarFilters } from './components/Calendar'
import { AddContentModal } from './components/Forms'
import { Button } from './components/ui/button'
import { AlertDialog } from './components/ui/alert-dialog'
import { ContentDetailPanel } from './components/DetailPanel'
import { Sidebar } from './shared/components/Sidebar'
import { SettingsModal } from './components/Forms/SettingsModal'
import { AppHeader } from './components/AppHeader'
import { getModuleFromPath, getViewFromPath, getViewRoute } from './routes'
import { useCallUpdates } from './modules/calling/hooks/useCallUpdates'

// Lazy-loaded module views (code splitting)
const SkillMasteryView = lazy(() => import('./modules/skillMastery').then(m => ({ default: m.SkillMasteryView })))
const ContentStudioView = lazy(() => import('./modules/contentStudio').then(m => ({ default: m.ContentStudioView })))
const ListView = lazy(() => import('./components/Views').then(m => ({ default: m.ListView })))
const LeadsView = lazy(() => import('./components/Views').then(m => ({ default: m.LeadsView })))
const TaskBoardsView = lazy(() => import('./components/Views').then(m => ({ default: m.TaskBoardsView })))
const JobsView = lazy(() => import('./components/Views').then(m => ({ default: m.JobsView })))
const TemplatesView = lazy(() => import('./components/Views').then(m => ({ default: m.TemplatesView })))
const CallingView = lazy(() => import('./modules/calling').then(m => ({ default: m.CallingView })))
const AutomationViewPage = lazy(() => import('./modules/automation').then(m => ({ default: m.AutomationView })))

// Loading fallback for lazy-loaded modules
function ModuleLoader() {
    return (
        <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-text-muted text-xs font-medium">Loading module...</p>
            </div>
        </div>
    )
}




// App State Reducer
interface AppState {
    showAddModal: boolean
    selectedDate: string | null
    editingContent: Content | null
    detailContent: Content | null
}

type AppAction =
    | { type: 'OPEN_ADD_MODAL'; date: string | null }
    | { type: 'OPEN_EDIT_MODAL'; content: Content }
    | { type: 'CLOSE_MODAL' }
    | { type: 'OPEN_DETAIL'; content: Content }
    | { type: 'CLOSE_DETAIL' }

const initialState: AppState = {
    showAddModal: false,
    selectedDate: null,
    editingContent: null,
    detailContent: null
}

function appReducer(state: AppState, action: AppAction): AppState {
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

    // Global active call tracking (visible across all pages)
    const { activeCalls } = useCallUpdates({
        onCallUpdate: () => {
            // Dispatch custom event so CallingView can refresh its data
            window.dispatchEvent(new CustomEvent('call:updated'))
        },
    })

    // Calendar filters state
    const [calendarFilters, setCalendarFilters] = useState<CalendarFiltersType>({
        contents: true,
        tasks: false,
        jobs: false,
        leads: false,
        milestones: false
    })

    // Fetch calendar items based on filters
    const { items: calendarItems, rescheduleItem } = useCalendarItems(calendarFilters)

    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), [])
    const toggleSidebarCollapse = useCallback(() => setSidebarCollapsed(prev => !prev), [])
    const toggleSettings = useCallback(() => setShowSettings(prev => !prev), [])

    // Get last used video variant
    const lastUsedVariant = useMemo(() => {
        const sortedContents = [...contents]
            .filter(c => c.videoVariant)
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        return sortedContents[0]?.videoVariant || ''
    }, [contents])

    // Memoized handlers
    const handleAddContent = useCallback((date: string) => {
        dispatch({ type: 'OPEN_ADD_MODAL', date })
    }, [])

    const handleEditContent = useCallback((content: Content) => {
        dispatch({ type: 'OPEN_EDIT_MODAL', content })
    }, [])

    const handleCloseModal = useCallback(() => {
        dispatch({ type: 'CLOSE_MODAL' })
    }, [])

    const handleSaveContent = useCallback((contentData: Partial<Content>) => {
        if (state.editingContent) {
            updateContent(state.editingContent.id, contentData)
        } else {
            addContent(contentData)
        }
        dispatch({ type: 'CLOSE_MODAL' })
    }, [state.editingContent, updateContent, addContent])

    const handleDeleteContent = useCallback(async (id: string) => {
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

    const handleViewChange = useCallback((newView: string) => {
        navigate(getViewRoute(newView))
    }, [navigate])

    // State for navigating to a specific board from leads
    const [navigateToBoardId, setNavigateToBoardId] = useState<string | null>(null)

    const handleNavigateToBoard = useCallback((boardId: string) => {
        setNavigateToBoardId(boardId)
        navigate(`/taskboards/${boardId}`)
    }, [navigate])

    const handleOpenDetail = useCallback((content: Content) => {
        dispatch({ type: 'OPEN_DETAIL', content })
    }, [])

    const handleCloseDetail = useCallback(() => {
        dispatch({ type: 'CLOSE_DETAIL' })
    }, [])

    const handleEditFromDetail = useCallback((content: Content) => {
        dispatch({ type: 'CLOSE_DETAIL' })
        dispatch({ type: 'OPEN_EDIT_MODAL', content })
    }, [])

    const handleUpdateContentFromDetail = useCallback((contentData: Content) => {
        updateContent(contentData.id, contentData)
    }, [updateContent])

    // Handle calendar filter changes
    const handleCalendarFilterChange = useCallback((newFilters: CalendarFiltersType) => {
        setCalendarFilters(newFilters)
    }, [])

    // Handle calendar item date change (drag and drop)
    const handleItemDateChange = useCallback(async (item: CalendarItem, newDate: string | Date) => {
        const dateStr = typeof newDate === 'string' ? newDate : newDate.toISOString().split('T')[0]
        const success = await rescheduleItem(item, dateStr)
        if (success) {
            toast.success(`${item.title} moved to ${newDate}`)
        } else {
            toast.error('Failed to reschedule item')
        }
    }, [rescheduleItem])

    // Handle calendar item click - navigate to appropriate module
    const handleCalendarItemClick = useCallback((item: CalendarItem) => {
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
        return contents.find(c => c.id === state.detailContent!.id) || null
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
                hasActiveCalls={activeCalls.length > 0}
            />

            {/* Main content area - add padding for desktop sidebar */}
            <div className={`${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-52'} transition-all duration-300`}>
                <div className="p-6">
                    <div className="max-w-[1600px] mx-auto">
                        {/* Header */}
                        <AppHeader
                            theme={theme}
                            onToggleTheme={toggleTheme}
                            onToggleSidebar={toggleSidebar}
                            onOpenSettings={toggleSettings}
                            activeCalls={activeCalls}
                        />

                        <Suspense fallback={<ModuleLoader />}>
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
                                                className={`px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${view === 'calendar'
                                                    ? 'bg-accent-primary text-white'
                                                    : 'bg-bg-secondary text-text-muted hover:text-text-primary border border-border'
                                                    }`}
                                            >
                                                <Calendar size={14} />
                                                <span>Calendar</span>
                                            </button>
                                            <button
                                                onClick={() => handleViewChange('list')}
                                                className={`px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${view === 'list'
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
                                        initialBoardId={navigateToBoardId || undefined}
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

                            {/* AI Calling Module */}
                            {activeModule === 'calling' && (
                                <main className="bg-bg-secondary/50 rounded-2xl border border-border p-6">
                                    <CallingView activeCalls={activeCalls} />
                                </main>
                            )}

                            {/* Automation Module */}
                            {activeModule === 'automation' && (
                                <main className="bg-bg-secondary/50 rounded-2xl border border-border p-6">
                                    <AutomationViewPage />
                                </main>
                            )}
                        </Suspense>

                        {/* Add/Edit Modal - Only for Calendar module quick add */}
                        {activeModule === 'schedule' && (
                            <AddContentModal
                                isOpen={state.showAddModal}
                                onClose={handleCloseModal}
                                onAdd={handleSaveContent}
                                initialDate={state.selectedDate || undefined}
                                editContent={state.editingContent}
                                onAddComment={async (id, text) => { await addComment(id, text) }}
                                onDeleteComment={async (id, commentId) => { await deleteComment(id, commentId) }}
                                topics={settings.topics as any}
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
                                onAddComment={async (id, text) => { await addComment(id, text) }}
                                onDeleteComment={async (id, commentId) => { await deleteComment(id, commentId) }}
                                onAddUrl={async (id, urlData) => { await addUrl(id, urlData) }}
                                onRemoveUrl={async (id, urlId) => { await removeUrl(id, urlId) }}
                                onUpdateContent={async (content) => { handleUpdateContentFromDetail(content) }}
                            />
                        )}

                        {/* Alert Dialog for confirmations */}
                        <AlertDialog
                            {...dialogState}
                            onClose={closeDialog}
                        />

                        {/* Settings Modal */}
                        <SettingsModal
                            isOpen={showSettings}
                            onClose={() => setShowSettings(false)}
                            settings={settings}
                            onSave={() => {
                                // settings are saved within the modal internally via JSON Server
                                setShowSettings(false)
                            }}
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

export default App
