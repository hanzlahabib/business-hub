import userRepository from '../repositories/userRepository.js'
import authService from '../services/authService.js'

/**
 * Auth Middleware: Verifies JWT from Authorization header.
 */
export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']

        // Primary: JWT Bearer token
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7)
            try {
                const payload = authService.verifyToken(token)
                const user = await userRepository.findById(payload.userId)
                if (!user) {
                    return res.status(401).json({ error: 'User not found' })
                }
                req.user = user
                return next()
            } catch {
                // Token invalid/expired
            }
        }

        return res.status(401).json({ error: 'Authentication required' })
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' })
    }
}

export default authMiddleware
