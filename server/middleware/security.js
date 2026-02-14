/**
 * Security middleware for Express.
 * Upload validation and file security checks.
 * 
 * Note: HTTP security headers are now handled by `helmet` in index.js.
 *
 * Usage:
 *   import { validateUpload } from './middleware/security.js'
 *   app.use('/api/upload', validateUpload())
 */

/**
 * Validate file upload (check extension, size, path traversal)
 */
export function validateUpload(options = {}) {
    const maxSize = options.maxSize || 10 * 1024 * 1024 // 10MB default
    const allowedExtensions = options.allowedExtensions || [
        '.pdf', '.doc', '.docx', '.txt', '.md',
        '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'
    ]

    return (req, res, next) => {
        if (!req.file && !req.files) return next()

        const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : [req.file]

        for (const file of files) {
            if (!file) continue

            // Check file size
            if (file.size > maxSize) {
                return res.status(413).json({
                    error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`
                })
            }

            // Check extension
            const ext = '.' + (file.originalname || '').split('.').pop().toLowerCase()
            if (!allowedExtensions.includes(ext)) {
                return res.status(415).json({
                    error: `File type "${ext}" is not allowed. Allowed: ${allowedExtensions.join(', ')}`
                })
            }

            // Check for path traversal in filename
            if (file.originalname && (file.originalname.includes('..') || file.originalname.includes('/'))) {
                return res.status(400).json({ error: 'Invalid filename.' })
            }
        }

        next()
    }
}
