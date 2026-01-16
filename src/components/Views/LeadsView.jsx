import { useState } from 'react'
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

export function LeadsView() {
  const { leads, createLead, updateLead, deleteLead, changeStatus, importLeads } = useLeads()
  const { createBoardFromLead } = useTaskBoards()

  const [selectedLead, setSelectedLead] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showEmailComposer, setShowEmailComposer] = useState(false)
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [editingLead, setEditingLead] = useState(null)

  const handleLeadClick = (lead) => {
    setSelectedLead(lead)
  }

  const handleAddLead = () => {
    setEditingLead(null)
    setShowAddModal(true)
  }

  const handleEditLead = (lead) => {
    setEditingLead(lead)
    setShowAddModal(true)
    setSelectedLead(null)
  }

  const handleSaveLead = async (data) => {
    if (editingLead) {
      await updateLead(editingLead.id, data)
    } else {
      await createLead(data)
    }
  }

  const handleDeleteLead = async (lead) => {
    if (confirm(`Delete ${lead.name}? This cannot be undone.`)) {
      await deleteLead(lead.id)
      setSelectedLead(null)
    }
  }

  const handleSendEmail = (lead) => {
    setSelectedLead(null)
    setShowEmailComposer(true)
    // Store the lead for email composer
    window.__emailComposerLead = lead
  }

  const handleCreateBoard = async (lead) => {
    await createBoardFromLead(lead)
    setSelectedLead(null)
  }

  const handleStatusChange = async (leadId, newStatus) => {
    await changeStatus(leadId, newStatus)
    // Update selected lead if it's the one being changed
    if (selectedLead?.id === leadId) {
      setSelectedLead(prev => ({ ...prev, status: newStatus }))
    }
  }

  const handleImport = async (leadsData) => {
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
        onClose={() => setSelectedLead(null)}
        onEdit={handleEditLead}
        onDelete={handleDeleteLead}
        onSendEmail={handleSendEmail}
        onCreateBoard={handleCreateBoard}
        onStatusChange={handleStatusChange}
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
