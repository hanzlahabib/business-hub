/**
 * Security middleware for Express.
 * Adds common security headers and basic protections.
 * 
 * Usage:
 *   const { securityHeaders } = require('./middleware/security')
 *   app.use(securityHeaders())
 */

function securityHeaders() {
    return (req, res, next) => {
        // Prevent clickjacking
        res.setHeader('X-Frame-Options', 'DENY')

        // Prevent MIME sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff')

        // Enable XSS filter
        res.setHeader('X-XSS-Protection', '1; mode=block')

        // Referrer policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

        // Content Security Policy (permissive for dev, tighten for production)
        res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' http://localhost:*"
        )

        // Permissions policy
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

        next()
    }
}

/**
 * Validate file upload (check extension, size)
 */
function validateUpload(options = {}) {
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

module.exports = { securityHeaders, validateUpload }
