import express from 'express'
import authService from '../services/authService.js'
import prisma from '../config/prisma.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await authService.login(email, password)
        res.json({ success: true, user })
    } catch (error) {
        res.status(401).json({ success: false, error: error.message })
    }
})

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body || {}
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' })
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(422).json({ success: false, error: 'Invalid email format' })
        }
        if (password.length < 6) {
            return res.status(422).json({ success: false, error: 'Password must be at least 6 characters' })
        }
        const user = await authService.register(req.body)
        res.json({ success: true, user })
    } catch (error) {
        res.status(400).json({ success: false, error: error.message })
    }
})

// Profile endpoints (requires auth)
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } })
        if (!user) return res.status(404).json({ error: 'User not found' })
        res.json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { id, email, password, createdAt, updatedAt, ...updateData } = req.body
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData
        })
        res.json(user)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

export default router

