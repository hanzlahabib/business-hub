// @ts-nocheck
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { LayoutGrid, List, Plus, AlertCircle, FileText } from 'lucide-react'
import { TemplateBoard } from '../../modules/templates/components/TemplateBoard'
import { TemplateList } from '../../modules/templates/components/TemplateList'
import { TemplateDetailPanel } from '../../modules/templates/components/TemplateDetailPanel'
import { AddTemplateModal } from '../../modules/templates/components/AddTemplateModal'
import { FolderTree } from '../../modules/templates/components/FolderTree'
import { useTemplates } from '../../modules/templates/hooks/useTemplates'
import { useTemplateFolders } from '../../modules/templates/hooks/useTemplateFolders'
import { useConfirmDialog } from '../../hooks/useConfirmDialog'
import { AlertDialog } from '../ui/alert-dialog'
import { LoadingSkeleton } from '../ui/loading-skeleton'
// import { LoadingSpinner } from '../ui/loading-spinner' // Unused import
import { EmptyState } from '../ui/empty-state'

export function TemplatesView() {
    const {
        templates,
        loading,
        error,
        fetchTemplates,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        toggleFavorite,
        togglePinned,
        incrementUsage
    } = useTemplates()

    const { folders, createFolder, updateFolder, deleteFolder } = useTemplateFolders()
    const { dialogState, confirm, close: closeDialog } = useConfirmDialog()

    const [showAddModal, setShowAddModal] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
    const [defaultCategory, setDefaultCategory] = useState<any>(null)
    const [view, setView] = useState<'board' | 'list'>('board') // 'board' | 'list'
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
    const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'recent'>('all') // 'all' | 'favorites' | 'recent'

    // Filter templates based on folder/filter selection
    const filteredTemplates = useMemo(() => {
        let result = templates

        if (selectedFolderId) {
            result = result.filter((t: any) => t.folderId === selectedFolderId)
        } else if (activeFilter === 'favorites') {
            result = result.filter((t: any) => t.isFavorite)
        } else if (activeFilter === 'recent') {
            result = result
                .filter((t: any) => t.lastUsedAt)
                .sort((a: any, b: any) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())
                .slice(0, 10)
        }

        return result
    }, [templates, selectedFolderId, activeFilter])

    const handleAddClick = useCallback((category: any = null) => {
        setDefaultCategory(category)
        setEditingTemplate(null)
        setShowAddModal(true)
    }, [])

    const handleEditTemplate = useCallback((template: any) => {
        setEditingTemplate(template)
        setShowAddModal(true)
        setSelectedTemplate(null)
    }, [])

    const handleSaveTemplate = useCallback(async (templateData: any) => {
        if (editingTemplate) {
            await updateTemplate(editingTemplate.id, templateData)
            toast.success('Template updated')
        } else {
            const data = {
                ...templateData,
                ...(defaultCategory && { category: defaultCategory }),
                ...(selectedFolderId && { folderId: selectedFolderId })
            }
            await createTemplate(data)
            toast.success('Template created')
        }
        setShowAddModal(false)
        setEditingTemplate(null)
        setDefaultCategory(null)
    }, [editingTemplate, defaultCategory, selectedFolderId, createTemplate, updateTemplate])

    const handleDeleteTemplate = useCallback(async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete Template',
            message: 'Are you sure you want to delete this template? This action cannot be undone.',
            variant: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        })
        if (confirmed) {
            await deleteTemplate(id)
            setSelectedTemplate(null)
            toast.success('Template deleted')
        }
    }, [confirm, deleteTemplate])

    const handleCopyTemplate = useCallback(async (template: any) => {
        await navigator.clipboard.writeText(template.rawMarkdown || '')
        await incrementUsage(template.id)
        toast.success('Copied to clipboard')
    }, [incrementUsage])

    const handleTemplateClick = useCallback((template: any) => {
        setSelectedTemplate(template)
    }, [])

    const handleToggleFavorite = useCallback(async (id: string) => {
        await toggleFavorite(id)
        if (selectedTemplate?.id === id) {
            const updated = templates.find((t: any) => t.id === id)
            setSelectedTemplate(updated)
        }
    }, [toggleFavorite, selectedTemplate, templates])

    const handleTogglePinned = useCallback(async (id: string) => {
        await togglePinned(id)
        if (selectedTemplate?.id === id) {
            const updated = templates.find((t: any) => t.id === id)
            setSelectedTemplate(updated)
        }
    }, [togglePinned, selectedTemplate, templates])

    const handleUpdateTemplate = useCallback(async (id: string, updates: any) => {
        await updateTemplate(id, updates)
        toast.success('Template saved')
    }, [updateTemplate])

    const handleDeleteFolder = useCallback(async (folderId: string) => {
        const templatesInFolder = templates.filter((t: any) => t.folderId === folderId)
        const confirmed = await confirm({
            title: 'Delete Folder',
            message: templatesInFolder.length > 0
                ? `This folder contains ${templatesInFolder.length} templates. They will be moved to "No folder". Continue?`
                : 'Are you sure you want to delete this folder?',
            variant: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        })
        if (confirmed) {
            // Move templates to no folder
            for (const t of templatesInFolder) {
                await updateTemplate(t.id, { folderId: null })
            }
            await deleteFolder(folderId)
            if (selectedFolderId === folderId) {
                setSelectedFolderId(null)
            }
            toast.success('Folder deleted')
        }
    }, [confirm, templates, updateTemplate, deleteFolder, selectedFolderId])

    // Keep selected template in sync
    const currentSelectedTemplate = selectedTemplate
        ? templates.find((t: any) => t.id === selectedTemplate.id) || null
        : null

    // Get current view title
    const viewTitle = useMemo(() => {
        if (selectedFolderId) {
            const folder = folders.find((f: any) => f.id === selectedFolderId)
            return folder?.name || 'Folder'
        }
        if (activeFilter === 'favorites') return 'Favorites'
        if (activeFilter === 'recent') return 'Recently Used'
        return 'All Templates'
    }, [selectedFolderId, activeFilter, folders])

    return (
        <div className="h-full flex">
            {/* Sidebar */}
            <FolderTree
                folders={folders}
                templates={templates}
                selectedFolderId={selectedFolderId}
                activeFilter={activeFilter}
                onFolderSelect={setSelectedFolderId}
                onFilterSelect={setActiveFilter}
                onCreateFolder={createFolder}
                onEditFolder={updateFolder}
                onDeleteFolder={handleDeleteFolder}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Stitch Header */}
                <div className="p-4 shrink-0">
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-pink-500/10 rounded-lg">
                                    <FileText className="w-6 h-6 text-pink-500" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">{viewTitle}</h1>
                                    <p className="text-sm text-text-muted">{filteredTemplates.length} templates</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleAddClick()}
                                className="flex items-center gap-2 px-4 py-2 bg-pink-500 rounded-lg text-sm font-medium text-white hover:bg-pink-600 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                New Template
                            </button>
                        </div>

                        {/* Stitch View Tabs */}
                        <div className="flex items-center border-b border-border">
                            <button
                                onClick={() => setView('board')}
                                className={`flex items-center gap-1.5 px-1 py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${view === 'board'
                                    ? 'text-pink-500 border-pink-500'
                                    : 'text-text-muted border-transparent hover:text-text-secondary hover:border-border'
                                    }`}
                            >
                                <LayoutGrid size={14} />
                                Board
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`flex items-center gap-1.5 px-1 py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${view === 'list'
                                    ? 'text-pink-500 border-pink-500'
                                    : 'text-text-muted border-transparent hover:text-text-secondary hover:border-border'
                                    }`}
                            >
                                <List size={14} />
                                List
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {loading && templates.length === 0 ? (
                        <div className="flex-1 p-4 overflow-x-auto">
                            <div className="flex gap-4 h-full">
                                {view === 'board' ? (
                                    [...Array(5)].map((_, i) => (
                                        <LoadingSkeleton key={i} variant="board" />
                                    ))
                                ) : (
                                    <div className="w-full space-y-2">
                                        {[...Array(5)].map((_, i) => (
                                            <LoadingSkeleton key={i} variant="list" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : error ? (
                        <div className="h-full flex items-center justify-center">
                            <EmptyState
                                icon={AlertCircle}
                                title="Failed to Load Templates"
                                description={error}
                                action={{
                                    label: 'Try Again',
                                    onClick: fetchTemplates,
                                    variant: 'primary'
                                }}
                            />
                        </div>
                    ) : view === 'board' ? (
                        <TemplateBoard
                            templates={filteredTemplates}
                            onTemplateClick={handleTemplateClick}
                            onAddClick={handleAddClick}
                            onCopy={handleCopyTemplate}
                        />
                    ) : (
                        <TemplateList
                            templates={filteredTemplates}
                            onTemplateClick={handleTemplateClick}
                            onCopy={handleCopyTemplate}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    )}
                </div>
            </div>

            {/* Modals */}
            <AddTemplateModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false)
                    setEditingTemplate(null)
                    setDefaultCategory(null)
                }}
                onSave={handleSaveTemplate}
                editTemplate={editingTemplate}
                folders={folders}
            />

            <TemplateDetailPanel
                template={currentSelectedTemplate}
                isOpen={!!currentSelectedTemplate}
                onClose={() => setSelectedTemplate(null)}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                onCopy={handleCopyTemplate}
                onToggleFavorite={handleToggleFavorite}
                onTogglePinned={handleTogglePinned}
                onUpdate={handleUpdateTemplate}
            />

            <AlertDialog
                {...dialogState}
                onClose={closeDialog}
            />
        </div>
    )
}

export default TemplatesView
