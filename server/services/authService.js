import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import userRepository from '../repositories/userRepository.js'
import logger from '../config/logger.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET)
}

export const authService = {
    async login(email, password) {
        const user = await userRepository.findByEmail(email)
        if (!user) {
            throw new Error('Invalid email or password')
        }

        let valid = false

        // Try bcrypt verify first (new hashed passwords)
        if (user.passwordHash && user.passwordHash.startsWith('$2')) {
            valid = await bcrypt.compare(password, user.passwordHash)
        } else if (user.passwordHash === password) {
            // Legacy plaintext match — migrate to bcrypt hash
            valid = true
            const hash = await bcrypt.hash(password, 10)
            await userRepository.update(user.id, { passwordHash: hash })
            logger.info(`Migrated plaintext password to bcrypt for user ${user.id}`)
        }

        if (!valid) {
            throw new Error('Invalid email or password')
        }

        const token = generateToken(user.id)

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                settings: user.settings
            }
        }
    },

    async register(data) {
        const existing = await userRepository.findByEmail(data.email)
        if (existing) {
            throw new Error('User already exists')
        }

        const hash = await bcrypt.hash(data.password, 10)

        const user = await userRepository.create({
            email: data.email,
            name: data.name,
            passwordHash: hash
        })

        const token = generateToken(user.id)

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        }
    },

    verifyToken,
    generateToken
}

export default authService
