
import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    LeadBoard,
    LeadTableView,
    LeadDetailPanel,
    AddLeadModal,
    ImportLeadsModal,
    EmailComposer,
    TemplateManager,
    LeadTypeManager,
    BulkEditModal,
    useLeads
} from '../../modules/leads'
import { useTaskBoards } from '../../modules/taskboards'
import { LayoutGrid, List, Layers } from 'lucide-react'
import { AutomationQuickWidget } from '../../modules/automation'
import { toast } from 'sonner'
import { AlertDialog } from '../ui/alert-dialog'

export function LeadsView({ onNavigateToBoard }: { onNavigateToBoard?: (boardId: string) => void }) {
    const { leadId } = useParams()
    const navigate = useNavigate()
    const { leads, loading, error, fetchLeads, createLead, updateLead, deleteLead, changeStatus, bulkUpdate, bulkDelete, importLeads } = useLeads()
    const { boards, createBoardFromLead, getBoardByLeadId } = useTaskBoards()

    // View mode: table (Stitch default) or kanban
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

    // Get selected lead from URL params
    const selectedLead = useMemo(() => {
        if (!leadId) return null
        return leads.find(l => l.id === leadId) || null
    }, [leadId, leads])

    const [showAddModal, setShowAddModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [showEmailComposer, setShowEmailComposer] = useState(false)
    const [showTemplateManager, setShowTemplateManager] = useState(false)
    const [showLeadTypes, setShowLeadTypes] = useState(false)
    const [editingLead, setEditingLead] = useState<any>(null)
    const [showBulkEdit, setShowBulkEdit] = useState(false)
    const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([])
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'single'; lead: any } | { type: 'bulk'; ids: string[] } | null>(null)

    const handleLeadClick = (lead: any) => {
        navigate(`/leads/${lead.id}`)
    }

    const handleAddLead = () => {
        setEditingLead(null)
        setShowAddModal(true)
    }

    const handleEditLead = (lead: any) => {
        setEditingLead(lead)
        setShowAddModal(true)
        navigate('/leads')
    }

    const handleSaveLead = async (data: any) => {
        if (editingLead) {
            await updateLead(editingLead.id, data)
        } else {
            await createLead(data)
        }
        // Force refresh to ensure UI is in sync
        await fetchLeads()
    }

    const handleDeleteLead = (lead: any) => {
        setDeleteTarget({ type: 'single', lead })
        setShowDeleteConfirm(true)
    }

    const handleBulkEdit = (ids: string[]) => {
        setBulkSelectedIds(ids)
        setShowBulkEdit(true)
    }

    const handleBulkSave = async (updates: Record<string, any>) => {
        await bulkUpdate(bulkSelectedIds, updates)
        setShowBulkEdit(false)
        setBulkSelectedIds([])
        await fetchLeads()
    }

    const handleBulkDelete = (ids: string[]) => {
        setDeleteTarget({ type: 'bulk', ids })
        setShowDeleteConfirm(true)
    }

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return
        if (deleteTarget.type === 'single') {
            await deleteLead(deleteTarget.lead.id)
            navigate('/leads')
        } else {
            await bulkDelete(deleteTarget.ids)
        }
        setShowDeleteConfirm(false)
        setDeleteTarget(null)
        await fetchLeads()
    }

    const handleChangeStatus = async (leadId: string, newStatus: string) => {
        await changeStatus(leadId, newStatus)
    }

    const handleSendEmail = (lead: any) => {
        navigate('/leads')
        setShowEmailComposer(true)
        window.__emailComposerLead = lead
    }

    const handleCreateBoard = async (lead: any) => {
        const existingBoard = getBoardByLeadId(lead.id)
        if (existingBoard) {
            toast.info('Board already exists for this lead')
            handleViewBoard(existingBoard.id)
            return
        }
        const board = await createBoardFromLead(lead)
        if (board) {
            toast.success('Board created successfully!')
        }
    }

    const handleViewBoard = (boardIdOrBoard: any) => {
        const boardId = typeof boardIdOrBoard === 'string' ? boardIdOrBoard : boardIdOrBoard?.id
        if (boardId && onNavigateToBoard) {
            navigate('/leads')
            onNavigateToBoard(boardId)
        } else {
            toast.error('Could not find the board')
        }
    }

    const linkedBoard = useMemo(() => {
        if (!selectedLead) return null
        if (selectedLead.linkedBoardId) {
            return boards.find(b => b.id === selectedLead.linkedBoardId) || null
        }
        return getBoardByLeadId(selectedLead.id) || null
    }, [selectedLead, boards, getBoardByLeadId])

    const handleImport = async (leadsData: any[]) => {
        return await importLeads(leadsData)
    }

    return (
        <div className="h-full flex flex-col">
            {/* Stitch-style page header */}
            <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-bg-secondary/50 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold text-text-primary tracking-tight">Leads</h1>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent-primary/20 text-accent-primary border border-accent-primary/20">
                        {leads.length} Active
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    {/* View toggle */}
                    <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                            title="Table View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                            title="Kanban View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowLeadTypes(!showLeadTypes)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${showLeadTypes
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                        }`}
                        title="Manage Lead Types"
                    >
                        <Layers className="w-4 h-4" />
                        Types
                    </button>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                        <span>Sort by:</span>
                        <button className="flex items-center gap-1 text-text-primary font-medium hover:text-accent-primary transition-colors">
                            Last Active
                        </button>
                    </div>
                </div>
            </header>

            {/* Lead Type Manager Panel */}
            {showLeadTypes && (
                <div className="border-b border-border bg-bg-secondary p-6 overflow-y-auto max-h-[50vh]">
                    <LeadTypeManager />
                </div>
            )}

            {/* Content: Table or Kanban */}
            <div className="flex-1 overflow-hidden flex flex-row">
                {viewMode === 'table' ? (
                    <LeadTableView
                        leads={leads}
                        loading={loading}
                        onLeadClick={handleLeadClick}
                        onAddClick={handleAddLead}
                        onImportClick={() => setShowImportModal(true)}
                        selectedLeadId={leadId}
                        onEditLead={handleEditLead}
                        onDeleteLead={handleDeleteLead}
                        onChangeStatus={handleChangeStatus}
                        onBulkEdit={handleBulkEdit}
                        onBulkDelete={handleBulkDelete}
                    />
                ) : (
                    <div className="flex-1 overflow-hidden">
                        <LeadBoard
                            leads={leads}
                            loading={loading}
                            error={error}
                            fetchLeads={fetchLeads}
                            onLeadClick={handleLeadClick}
                            onAddClick={handleAddLead}
                            onImportClick={() => setShowImportModal(true)}
                            onEditLead={handleEditLead}
                            onDeleteLead={handleDeleteLead}
                            onChangeStatus={handleChangeStatus}
                            onBulkEdit={handleBulkEdit}
                            onBulkDelete={handleBulkDelete}
                        />
                    </div>
                )}
            </div>

            {/* Overlay Drawer — fixed position, renders above everything */}
            {selectedLead && (
                <LeadDetailPanel
                    lead={selectedLead}
                    isOpen={!!selectedLead}
                    onClose={() => navigate('/leads')}
                    onEdit={handleEditLead}
                    onDelete={handleDeleteLead}
                    onSendEmail={handleSendEmail}
                    onCreateBoard={handleCreateBoard}
                    onViewBoard={handleViewBoard}
                    onStatusChange={handleChangeStatus}
                    linkedBoard={linkedBoard as any}
                />
            )}

            {/* Add/Edit Lead Modal */}
            <AddLeadModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={handleSaveLead}
                editLead={editingLead}
            />

            {/* Import Modal */}
            <ImportLeadsModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImport}
            />

            {/* Email Composer */}
            <EmailComposer
                isOpen={showEmailComposer}
                onClose={() => {
                    setShowEmailComposer(false)
                    window.__emailComposerLead = null
                }}
                lead={window.__emailComposerLead}
                onSuccess={() => { }}
            />

            {/* Template Manager */}
            <TemplateManager
                isOpen={showTemplateManager}
                onClose={() => setShowTemplateManager(false)}
            />

            {/* Bulk Edit Modal */}
            <BulkEditModal
                isOpen={showBulkEdit}
                onClose={() => setShowBulkEdit(false)}
                selectedCount={bulkSelectedIds.length}
                onSave={handleBulkSave}
            />

            {/* Delete Confirmation */}
            <AlertDialog
                isOpen={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null) }}
                onConfirm={handleConfirmDelete}
                variant="danger"
                title={
                    deleteTarget?.type === 'bulk'
                        ? `Delete ${deleteTarget.ids.length} leads?`
                        : `Delete "${deleteTarget?.type === 'single' ? deleteTarget.lead?.name : ''}"?`
                }
                message={
                    deleteTarget?.type === 'bulk'
                        ? `This action cannot be undone. ${deleteTarget.ids.length} leads will be permanently removed.`
                        : 'This action cannot be undone. This lead will be permanently removed.'
                }
                confirmText="Delete"
            />
        </div>
    )
}

export default LeadsView
