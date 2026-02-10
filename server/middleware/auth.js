import userRepository from '../repositories/userRepository.js'

/**
 * Migration Middleware: Authenticates the user.
 * For now, it expects a 'x-user-id' header or falls back to a mock user
 * to ensure the app stays functional during phase-by-phase migration.
 */
export const authMiddleware = async (req, res, next) => {
    const userId = req.headers['x-user-id'] || req.headers['authorization']?.split(' ')[1]

    if (!userId) {
        // If no user provided, use the first user in DB as fallback during migration
        const users = await userRepository.findByEmail('user@example.com')
        if (users) {
            req.user = users
            return next()
        }
        return res.status(401).json({ error: 'Authentication required' })
    }

    const user = await userRepository.findById(userId)
    if (!user) {
        return res.status(401).json({ error: 'User not found' })
    }

    req.user = user
    next()
}

export default authMiddleware
