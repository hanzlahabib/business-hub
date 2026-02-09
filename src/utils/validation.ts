/**
 * Zod validation schemas for form inputs and API payloads.
 * Use these to validate user input before sending to the API.
 */

// Note: Using lightweight validation without Zod dependency to avoid adding
// a new dependency. These follow a Zod-like pattern and can be swapped
// to real Zod schemas later.

export interface ValidationResult {
    valid: boolean
    errors: Record<string, string>
}

/** Validate content creation/update */
export function validateContent(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {}

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
        errors.title = 'Title is required'
    } else if (data.title.length > 200) {
        errors.title = 'Title must be 200 characters or less'
    }

    if (data.type && !['long', 'short'].includes(data.type)) {
        errors.type = 'Type must be "long" or "short"'
    }

    const validStatuses = ['idea', 'script', 'recording', 'editing', 'thumbnail', 'published']
    if (data.status && !validStatuses.includes(data.status)) {
        errors.status = `Status must be one of: ${validStatuses.join(', ')}`
    }

    if (data.scheduledDate && isNaN(Date.parse(data.scheduledDate))) {
        errors.scheduledDate = 'Invalid date format'
    }

    return { valid: Object.keys(errors).length === 0, errors }
}

/** Validate login inputs */
export function validateLogin(data: { email: string; password: string }): ValidationResult {
    const errors: Record<string, string> = {}

    if (!data.email || !data.email.includes('@')) {
        errors.email = 'Valid email is required'
    }

    if (!data.password || data.password.length < 4) {
        errors.password = 'Password must be at least 4 characters'
    }

    return { valid: Object.keys(errors).length === 0, errors }
}

/** Validate registration inputs */
export function validateRegister(data: {
    name: string
    email: string
    password: string
}): ValidationResult {
    const errors: Record<string, string> = {}

    if (!data.name || data.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters'
    }

    if (!data.email || !data.email.includes('@')) {
        errors.email = 'Valid email is required'
    }

    if (!data.password || data.password.length < 6) {
        errors.password = 'Password must be at least 6 characters'
    }

    return { valid: Object.keys(errors).length === 0, errors }
}

/** Validate template data */
export function validateTemplate(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {}

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.name = 'Template name is required'
    }

    if (data.name && data.name.length > 100) {
        errors.name = 'Template name must be 100 characters or less'
    }

    return { valid: Object.keys(errors).length === 0, errors }
}

/** Sanitize string input (strip HTML) */
export function sanitizeInput(input: string): string {
    return input.replace(/<[^>]*>/g, '').trim()
}

export default {
    validateContent,
    validateLogin,
    validateRegister,
    validateTemplate,
    sanitizeInput
}
