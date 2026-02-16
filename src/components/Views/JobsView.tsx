import { useState, useCallback } from 'react'
import { Briefcase } from 'lucide-react'
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

    const [selectedJob, setSelectedJob] = useState<any>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showSearchPanel, setShowSearchPanel] = useState(false)
    const [showEmailComposer, setShowEmailComposer] = useState(false)
    const [editingJob, setEditingJob] = useState<any>(null)
    const [emailJob, setEmailJob] = useState<any>(null)

    const handleJobClick = useCallback((job: any) => {
        setSelectedJob(job)
    }, [])

    const handleAddJob = useCallback(() => {
        setEditingJob(null)
        setShowAddModal(true)
    }, [])

    const handleEditJob = useCallback((job: any) => {
        setEditingJob(job)
        setShowAddModal(true)
        setSelectedJob(null)
    }, [])

    const handleSaveJob = useCallback(async (data: any) => {
        if (editingJob) {
            await updateJob(editingJob.id, data)
        } else {
            await createJob(data)
        }
        setShowAddModal(false)
    }, [editingJob, updateJob, createJob])

    const handleDeleteJob = useCallback(async (job: any) => {
        await deleteJob(job.id)
        setSelectedJob(null)
    }, [deleteJob])

    const handleStatusChange = useCallback(async (jobId: string, newStatus: string) => {
        await moveJob(jobId, newStatus)
        // Update selected job if it's the one being changed
        if (selectedJob?.id === jobId) {
            setSelectedJob((prev: any) => ({ ...prev, status: newStatus }))
        }
    }, [moveJob, selectedJob])

    const handleSendEmail = useCallback((job: any) => {
        setEmailJob(job)
        setShowEmailComposer(true)
        setSelectedJob(null)
    }, [])

    const handleAddInterview = useCallback(async (jobId: string, date: string) => {
        await addInterviewDate(jobId, date)
        // Update selected job
        if (selectedJob?.id === jobId) {
            setSelectedJob((prev: any) => ({
                ...prev,
                interviewDates: [...(prev.interviewDates || []), date]
            }))
        }
    }, [addInterviewDate, selectedJob])

    return (
        <div className="h-full flex flex-col">
            {/* Stitch Header */}
            <div className="shrink-0 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Briefcase className="w-6 h-6 text-indigo-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Job Tracker</h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                <JobBoard
                    onJobClick={handleJobClick}
                    onAddClick={handleAddJob}
                    onSearchClick={() => setShowSearchPanel(true)}
                />
            </div>

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
