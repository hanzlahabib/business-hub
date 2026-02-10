import userRepository from '../repositories/userRepository.js'

export const authService = {
    async login(email, password) {
        const user = await userRepository.findByEmail(email)

        // Simple mock comparison for now, as requested/stated in project status
        if (!user || user.passwordHash !== password) {
            throw new Error('Invalid email or password')
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            settings: user.settings
        }
    },

    async register(data) {
        const existing = await userRepository.findByEmail(data.email)
        if (existing) {
            throw new Error('User already exists')
        }

        return userRepository.create({
            email: data.email,
            name: data.name,
            passwordHash: data.password // Store as-is for now (dev-grade)
        })
    }
}

export default authService
