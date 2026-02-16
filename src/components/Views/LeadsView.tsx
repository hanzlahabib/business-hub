// @ts-nocheck
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
    useLeads
} from '../../modules/leads'
import { useTaskBoards } from '../../modules/taskboards'
import { LayoutGrid, List } from 'lucide-react'
import { AutomationQuickWidget } from '../../modules/automation'
import { toast } from 'sonner'

export function LeadsView({ onNavigateToBoard }: { onNavigateToBoard?: (boardId: string) => void }) {
    const { leadId } = useParams()
    const navigate = useNavigate()
    const { leads, createLead, updateLead, deleteLead, changeStatus, importLeads } = useLeads()
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
    const [editingLead, setEditingLead] = useState<any>(null)

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
    }

    const handleDeleteLead = async (lead: any) => {
        await deleteLead(lead.id)
        navigate('/leads')
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

    const handleStatusChange = async (leadId: string, newStatus: string) => {
        await changeStatus(leadId, newStatus)
    }

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
                    <div className="h-8 w-px bg-border" />
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                        <span>Sort by:</span>
                        <button className="flex items-center gap-1 text-text-primary font-medium hover:text-accent-primary transition-colors">
                            Last Active
                        </button>
                    </div>
                </div>
            </header>

            {/* Content: Table or Kanban + Inline Detail Panel */}
            <div className="flex-1 overflow-hidden flex flex-row">
                {viewMode === 'table' ? (
                    <LeadTableView
                        onLeadClick={handleLeadClick}
                        onAddClick={handleAddLead}
                        onImportClick={() => setShowImportModal(true)}
                        selectedLeadId={leadId}
                    />
                ) : (
                    <div className="flex-1 overflow-hidden">
                        <LeadBoard
                            onLeadClick={handleLeadClick}
                            onAddClick={handleAddLead}
                            onImportClick={() => setShowImportModal(true)}
                        />
                    </div>
                )}

                {/* Inline Detail Panel — Stitch-style aside sidebar */}
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
                        onStatusChange={handleStatusChange}
                        linkedBoard={linkedBoard}
                    />
                )}
            </div>

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
        </div>
    )
}

export default LeadsView
