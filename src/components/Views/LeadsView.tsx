import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    LeadBoard,
    LeadDetailPanel,
    AddLeadModal,
    ImportLeadsModal,
    EmailComposer,
    TemplateManager,
    useLeads
} from '../../modules/leads'
import { useTaskBoards } from '../../modules/taskboards'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'

export function LeadsView({ onNavigateToBoard }: { onNavigateToBoard?: (boardId: string) => void }) {
    const { leadId } = useParams()
    const navigate = useNavigate()
    const { leads, createLead, updateLead, deleteLead, changeStatus, importLeads } = useLeads()
    const { boards, createBoardFromLead, getBoardByLeadId } = useTaskBoards()

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
        if (confirm(`Delete ${lead.name}? This cannot be undone.`)) {
            await deleteLead(lead.id)
            navigate('/leads')
        }
    }

    const handleSendEmail = (lead: any) => {
        navigate('/leads')
        setShowEmailComposer(true)
        // Store the lead for email composer
        window.__emailComposerLead = lead
    }

    const handleCreateBoard = async (lead: any) => {
        // Check if board already exists
        const existingBoard = getBoardByLeadId(lead.id)
        if (existingBoard) {
            toast.info('Board already exists for this lead')
            handleViewBoard(existingBoard.id)
            return
        }

        const board = await createBoardFromLead(lead)
        if (board) {
            toast.success('Board created successfully!')
            // linkedBoardId will be updated in the leads state automatically
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

    // Get linked board for selected lead
    const linkedBoard = useMemo(() => {
        if (!selectedLead) return null
        // First check linkedBoardId on lead
        if (selectedLead.linkedBoardId) {
            return boards.find(b => b.id === selectedLead.linkedBoardId) || null
        }
        // Fallback: check if any board has this leadId
        return getBoardByLeadId(selectedLead.id) || null
    }, [selectedLead, boards, getBoardByLeadId])

    const handleStatusChange = async (leadId: string, newStatus: string) => {
        await changeStatus(leadId, newStatus)
        // selectedLead will be updated automatically via leads state
    }

    const handleImport = async (leadsData: any[]) => {
        return await importLeads(leadsData)
    }

    return (
        <div className="h-[calc(100vh-200px)]">
            <LeadBoard
                onLeadClick={handleLeadClick}
                onAddClick={handleAddLead}
                onImportClick={() => setShowImportModal(true)}
            />

            {/* Template Manager Button */}
            <button
                onClick={() => setShowTemplateManager(true)}
                className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 transition-colors shadow-lg"
            >
                <FileText className="w-5 h-5" />
                Email Templates
            </button>

            {/* Lead Detail Panel */}
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
                onSuccess={() => {
                    // Refresh leads if needed
                }}
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
