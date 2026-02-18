import { z } from 'zod'
import logger from '../config/logger.js'

/**
 * Express middleware factory: validates req.body against a Zod schema.
 * Returns 422 with structured errors on failure.
 */
export function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body)
        if (!result.success) {
            const errors = result.error.issues.map(i => ({
                path: i.path.join('.'),
                message: i.message,
            }))
            logger.warn('Validation failed', { path: req.path, errors })
            return res.status(422).json({ error: 'Validation failed', details: errors })
        }
        req.body = result.data // stripped of unknown fields
        next()
    }
}

// ─── LEAD SCHEMAS ───
export const createLeadSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    status: z.string().min(1, 'Status is required'),
    company: z.string().optional(),
    contactPerson: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    source: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().optional(),
    websiteIssues: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    linkedBoardId: z.string().optional(),
    followUpDate: z.string().optional(),
    notes: z.string().optional(),
    typeId: z.string().optional(),
    value: z.number().optional(),
})

export const updateLeadSchema = createLeadSchema.partial()

// ─── JOB SCHEMAS ───
export const createJobSchema = z.object({
    title: z.string().optional(),
    role: z.string().optional(),
    company: z.string().min(1, 'Company is required'),
    location: z.string().optional(),
    locationType: z.enum(['remote', 'onsite', 'hybrid']).optional(),
    status: z.string().optional(),
    description: z.string().optional(),
    contactPerson: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    experienceLevel: z.string().optional(),
    priority: z.string().optional(),
    notes: z.string().optional(),
    source: z.string().optional(),
    sourceUrl: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    salaryCurrency: z.string().optional(),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional(),
    appliedAt: z.string().optional(),
    interviewDates: z.array(z.string()).optional(),
})

export const updateJobSchema = createJobSchema.partial()

// ─── CONTENT SCHEMAS ───
export const createContentSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    type: z.string().optional(),
    status: z.string().optional(),
    topic: z.string().optional(),
    hook: z.string().optional(),
    notes: z.string().optional(),
    scheduledDate: z.string().optional(),
    publishedDate: z.string().optional(),
    presentationReady: z.boolean().optional(),
    sourceVideoId: z.string().optional(),
    slideDetails: z.any().optional(),
    comments: z.any().optional(),
    urls: z.any().optional(),
})

export const updateContentSchema = createContentSchema.partial()

// ─── TASK BOARD SCHEMAS ───
export const createTaskBoardSchema = z.object({
    name: z.string().min(1, 'Board name is required'),
    columns: z.any().optional(),
    leadId: z.string().optional(),
})

export const updateTaskBoardSchema = createTaskBoardSchema.partial()

// ─── TASK SCHEMAS ───
export const createTaskSchema = z.object({
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    columnId: z.string().optional(),
    position: z.number().optional(),
    assignee: z.string().optional(),
    leadId: z.string().optional(),
    subtasks: z.any().optional(),
    tags: z.array(z.string()).optional(),
    dueDate: z.string().optional(),
    boardId: z.string().optional(),
})

export const updateTaskSchema = createTaskSchema.partial()

// ─── TEMPLATE SCHEMAS ───
export const createTemplateSchema = z.object({
    name: z.string().min(1, 'Template name is required'),
    category: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    coverImage: z.string().optional(),
    content: z.any().optional(),
    rawMarkdown: z.string().optional(),
    subject: z.string().optional(),
    status: z.string().optional(),
    tags: z.array(z.string()).optional(),
    variables: z.array(z.string()).optional(),
    isFavorite: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    isLocked: z.boolean().optional(),
    folderId: z.string().optional(),
})

export const updateTemplateSchema = createTemplateSchema.partial()

// ─── TEMPLATE FOLDER SCHEMAS ───
export const createTemplateFolderSchema = z.object({
    name: z.string().min(1, 'Folder name is required'),
    icon: z.string().optional(),
    color: z.string().optional(),
})

// ─── MESSAGE SCHEMAS ───
export const createMessageSchema = z.object({
    leadId: z.string().optional(),
    type: z.string().min(1),
    channel: z.string().min(1),
    subject: z.string().optional(),
    body: z.string().optional(),
    templateId: z.string().optional(),
    status: z.string().optional(),
})

// ─── EMAIL TEMPLATE SCHEMAS ───
export const createEmailTemplateSchema = z.object({
    name: z.string().min(1, 'Template name is required'),
    subject: z.string().optional(),
    body: z.string().optional(),
})

// ─── CALL SCRIPT SCHEMAS ───
export const createCallScriptSchema = z.object({
    name: z.string().min(1, 'Script name is required'),
    purpose: z.string().optional(),
    industry: z.string().optional(),
    openingLine: z.string().optional(),
    talkingPoints: z.any().optional(),
    objectionHandlers: z.any().optional(),
    closingStrategy: z.string().optional(),
    rateRange: z.any().optional(),
    assistantConfig: z.any().optional(),
    isActive: z.boolean().optional(),
})

export const updateCallScriptSchema = createCallScriptSchema.partial()

// ─── PROPOSAL SCHEMAS ───
export const createProposalSchema = z.object({
    title: z.string().min(1, 'Proposal title is required'),
    status: z.string().optional(),
    content: z.any().optional(),
    totalValue: z.number().optional(),
    currency: z.string().optional(),
    validUntil: z.string().optional(),
    leadId: z.string().min(1, 'Lead ID is required'),
})

export const updateProposalSchema = createProposalSchema.partial()

// ─── AUTOMATION RULE SCHEMAS ───
export const createAutomationRuleSchema = z.object({
    name: z.string().min(1, 'Rule name is required'),
    description: z.string().optional(),
    trigger: z.string().min(1, 'Trigger is required'),
    conditions: z.any().optional(),
    actions: z.any(),
    enabled: z.boolean().optional(),
})

// ─── AUTH SCHEMAS ───
export const registerSchema = z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().optional(),
})

export const loginSchema = z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required'),
})
