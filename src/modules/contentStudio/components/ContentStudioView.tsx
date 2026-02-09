import { memo, useCallback, useMemo, useReducer } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, LayoutGrid, List, Table2, BookOpen } from 'lucide-react'
import { useSchedule } from '@/hooks/useSchedule'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { Button } from '@/components/ui/button'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { AddContentModal, SettingsModal, VariantGuideModal } from '@/components/Forms'
import { ContentDetailPanel } from '@/components/DetailPanel'
import { TaskFlow } from '@/components/TaskFlow'
import { TableView } from '@/components/Views'
import { ContentStats } from './ContentStats'
import { ContentPipeline } from './ContentPipeline'
import { ContentList } from './ContentList'
import { Content } from '@/components/Calendar/ContentCard'

// Get view from URL
function getContentViewFromPath(pathname: string): 'pipeline' | 'list' | 'table' {
    if (pathname === '/content/pipeline') return 'pipeline'
    if (pathname === '/content/list') return 'list'
    if (pathname === '/content/table') return 'table'
    return 'pipeline' // Default view for content studio
}

// State reducer
interface ContentState {
    showAddModal: boolean
    showSettingsModal: boolean
    showVariantGuide: boolean
    selectedDate: string | null
    editingContent: Content | null
    detailContent: Content | null
    filterStage: Content['status'] | null
}

type ContentAction =
    | { type: 'OPEN_ADD_MODAL'; date?: string }
    | { type: 'OPEN_EDIT_MODAL'; content: Content }
    | { type: 'CLOSE_MODAL' }
    | { type: 'OPEN_SETTINGS' }
    | { type: 'CLOSE_SETTINGS' }
    | { type: 'OPEN_VARIANT_GUIDE' }
    | { type: 'CLOSE_VARIANT_GUIDE' }
    | { type: 'OPEN_DETAIL'; content: Content }
    | { type: 'CLOSE_DETAIL' }
    | { type: 'SET_FILTER_STAGE'; stage: Content['status'] }

const initialState: ContentState = {
    showAddModal: false,
    showSettingsModal: false,
    showVariantGuide: false,
    selectedDate: null,
    editingContent: null,
    detailContent: null,
    filterStage: null
}

function contentReducer(state: ContentState, action: ContentAction): ContentState {
    switch (action.type) {
        case 'OPEN_ADD_MODAL':
            return { ...state, showAddModal: true, selectedDate: action.date || null, editingContent: null }
        case 'OPEN_EDIT_MODAL':
            return { ...state, showAddModal: true, editingContent: action.content, selectedDate: action.content.scheduledDate || null, detailContent: null }
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
        case 'OPEN_DETAIL':
            return { ...state, detailContent: action.content }
        case 'CLOSE_DETAIL':
            return { ...state, detailContent: null }
        case 'SET_FILTER_STAGE':
            return { ...state, filterStage: state.filterStage === action.stage ? null : action.stage }
        default:
            return state
    }
}

export const ContentStudioView = memo(function ContentStudioView() {
    const navigate = useNavigate()
    const location = useLocation()
    const view = getContentViewFromPath(location.pathname)

    const {
        contents,
        settings,
        addContent,
        updateContent,
        deleteContent,
        moveToStatus,
        getStats,
        getStreak,
        updateSettings,
        addComment,
        deleteComment,
        addUrl,
        removeUrl
    } = useSchedule()

    const { dialogState, confirm, close: closeDialog } = useConfirmDialog()
    const [state, dispatch] = useReducer(contentReducer, initialState)

    // Memoized stats and streak
    const stats = useMemo(() => getStats(), [contents, getStats])
    const streak = useMemo(() => getStreak(), [contents, getStreak])

    // Filtered contents based on selected stage
    const filteredContents = useMemo(() => {
        if (!state.filterStage) return contents
        return contents.filter(c => c.status === state.filterStage)
    }, [contents, state.filterStage])

    // Get last used video variant for auto-rotation
    const lastUsedVariant = useMemo(() => {
        const sortedContents = [...contents]
            .filter(c => c.videoVariant)
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        return sortedContents[0]?.videoVariant || ''
    }, [contents])

    // Handlers
    const handleAddContent = useCallback((date?: string) => {
        dispatch({ type: 'OPEN_ADD_MODAL', date })
    }, [])

    const handleEditContent = useCallback((content: Content) => {
        dispatch({ type: 'OPEN_EDIT_MODAL', content })
    }, [])

    const handleCloseModal = useCallback(() => {
        dispatch({ type: 'CLOSE_MODAL' })
    }, [])

    const handleSaveContent = useCallback((contentData: any) => {
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
        if (newView === 'pipeline') {
            navigate('/content')
        } else {
            navigate(`/content/${newView}`)
        }
    }, [navigate])

    const handleOpenSettings = useCallback(() => {
        dispatch({ type: 'OPEN_SETTINGS' })
    }, [])

    const handleCloseSettings = useCallback(() => {
        dispatch({ type: 'CLOSE_SETTINGS' })
    }, [])

    const handleSaveSettings = useCallback((newSettings: any) => {
        updateSettings(newSettings)
    }, [updateSettings])

    const handleOpenVariantGuide = useCallback(() => {
        dispatch({ type: 'OPEN_VARIANT_GUIDE' })
    }, [])

    const handleCloseVariantGuide = useCallback(() => {
        dispatch({ type: 'CLOSE_VARIANT_GUIDE' })
    }, [])

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

    const handleUpdateContentFromDetail = useCallback(async (contentData: Content) => {
        await updateContent(contentData.id, contentData)
    }, [updateContent])

    const handleUpdateStatus = useCallback((id: string, newStatus: string) => {
        moveToStatus(id, newStatus as Content['status'])
    }, [moveToStatus])

    // Keep detail content in sync with contents array
    const currentDetailContent = useMemo(() => {
        if (!state.detailContent) return null
        return contents.find(c => c.id === state.detailContent?.id) || null
    }, [state.detailContent, contents])

    const todayDate = useMemo(() => new Date().toISOString().split('T')[0], [])

    return (
        <>
            {/* Stats Bar */}
            <div className="mb-6">
                <ContentStats
                    stats={stats}
                    streak={streak}
                    onOpenSettings={handleOpenSettings}
                    goalsEnabled={settings.goalsEnabled !== false}
                />
            </div>

            {/* Task Flow Pipeline (hidden in pipeline view since it has its own analytics) */}
            {view !== 'pipeline' && (
                <div className="mb-6">
                    <TaskFlow
                        contents={contents}
                        activeStage={state.filterStage}
                        onStageClick={(stage) => dispatch({ type: 'SET_FILTER_STAGE', stage: stage as Content['status'] })}
                        showStats={true}
                    />
                </div>
            )}

            {/* Main Content */}
            <main className="bg-bg-secondary/50 rounded-2xl border border-border p-6">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                    {/* View Switcher */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleViewChange('pipeline')}
                            className={`px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${view === 'pipeline'
                                ? 'bg-accent-primary text-white'
                                : 'bg-bg-secondary text-text-muted hover:text-text-primary border border-border'
                                }`}
                        >
                            <LayoutGrid size={14} />
                            <span>Pipeline</span>
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
                        <button
                            onClick={() => handleViewChange('table')}
                            className={`px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${view === 'table'
                                ? 'bg-accent-primary text-white'
                                : 'bg-bg-secondary text-text-muted hover:text-text-primary border border-border'
                                }`}
                        >
                            <Table2 size={14} />
                            <span>Table</span>
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleOpenVariantGuide}
                            className="px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-muted hover:text-accent-primary hover:border-accent-primary transition-colors flex items-center gap-1.5 text-xs"
                        >
                            <BookOpen size={14} />
                            <span className="hidden sm:inline">Variants</span>
                        </button>
                        <Button onClick={() => handleAddContent(todayDate)}>
                            <Plus size={16} />
                            <span className="text-xs">Add Video</span>
                        </Button>
                    </div>
                </div>

                {/* Views */}
                {view === 'pipeline' && (
                    <ContentPipeline
                        contents={filteredContents}
                        settings={settings}
                        onEditContent={handleEditContent}
                        onDeleteContent={handleDeleteContent}
                        onStatusChange={moveToStatus}
                        onAddContent={() => handleAddContent(todayDate)}
                        onOpenDetail={handleOpenDetail}
                    />
                )}
                {view === 'list' && (
                    <ContentList
                        contents={filteredContents}
                        onEdit={handleEditContent}
                        onDelete={handleDeleteContent}
                        onOpenDetail={handleOpenDetail}
                    />
                )}
                {view === 'table' && (
                    <TableView
                        contents={filteredContents}
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
                initialDate={state.selectedDate || undefined}
                editContent={state.editingContent}
                onAddComment={async (id, text) => { await addComment(id, text) }}
                onDeleteComment={async (id, commentId) => { await deleteComment(id, commentId) }}
                topics={settings.topics as any}
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
                onAddComment={async (id, text) => { await addComment(id, text) }}
                onDeleteComment={async (id, commentId) => { await deleteComment(id, commentId) }}
                onAddUrl={async (id, data) => { await addUrl(id, data) }}
                onRemoveUrl={async (id, urlId) => { await removeUrl(id, urlId) }}
                onUpdateContent={handleUpdateContentFromDetail}
            />

            {/* Alert Dialog for confirmations */}
            <AlertDialog
                {...dialogState}
                onClose={closeDialog}
            />
        </>
    )
})

export default ContentStudioView
