import { useState, useCallback } from 'react'
import {
  JobBoard,
  JobDetailPanel,
  AddJobModal,
  JobSearchPanel,
  OutreachComposer,
  useJobs
} from '../../modules/jobs'

export function JobsView() {
  const { createJob, updateJob, deleteJob, moveJob, addInterviewDate } = useJobs()

  const [selectedJob, setSelectedJob] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [showEmailComposer, setShowEmailComposer] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [emailJob, setEmailJob] = useState(null)

  const handleJobClick = useCallback((job) => {
    setSelectedJob(job)
  }, [])

  const handleAddJob = useCallback(() => {
    setEditingJob(null)
    setShowAddModal(true)
  }, [])

  const handleEditJob = useCallback((job) => {
    setEditingJob(job)
    setShowAddModal(true)
    setSelectedJob(null)
  }, [])

  const handleSaveJob = useCallback(async (data) => {
    if (editingJob) {
      await updateJob(editingJob.id, data)
    } else {
      await createJob(data)
    }
    setShowAddModal(false)
  }, [editingJob, updateJob, createJob])

  const handleDeleteJob = useCallback(async (job) => {
    await deleteJob(job.id)
    setSelectedJob(null)
  }, [deleteJob])

  const handleStatusChange = useCallback(async (jobId, newStatus) => {
    await moveJob(jobId, newStatus)
    // Update selected job if it's the one being changed
    if (selectedJob?.id === jobId) {
      setSelectedJob(prev => ({ ...prev, status: newStatus }))
    }
  }, [moveJob, selectedJob])

  const handleSendEmail = useCallback((job) => {
    setEmailJob(job)
    setShowEmailComposer(true)
    setSelectedJob(null)
  }, [])

  const handleAddInterview = useCallback(async (jobId, date) => {
    await addInterviewDate(jobId, date)
    // Update selected job
    if (selectedJob?.id === jobId) {
      setSelectedJob(prev => ({
        ...prev,
        interviewDates: [...(prev.interviewDates || []), date]
      }))
    }
  }, [addInterviewDate, selectedJob])

  return (
    <div className="h-[calc(100vh-200px)]">
      <JobBoard
        onJobClick={handleJobClick}
        onAddClick={handleAddJob}
        onSearchClick={() => setShowSearchPanel(true)}
      />

      {/* Job Detail Panel */}
      <JobDetailPanel
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onEdit={handleEditJob}
        onDelete={handleDeleteJob}
        onStatusChange={handleStatusChange}
        onSendEmail={handleSendEmail}
        onAddInterview={handleAddInterview}
      />

      {/* Add/Edit Modal */}
      <AddJobModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveJob}
        editJob={editingJob}
      />

      {/* Job Search Panel */}
      <JobSearchPanel
        isOpen={showSearchPanel}
        onClose={() => setShowSearchPanel(false)}
      />

      {/* Email Composer */}
      <OutreachComposer
        isOpen={showEmailComposer}
        onClose={() => {
          setShowEmailComposer(false)
          setEmailJob(null)
        }}
        job={emailJob}
      />
    </div>
  )
}

export default JobsView
