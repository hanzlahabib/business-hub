import express from 'express'
import authService from '../services/authService.js'
import prisma from '../config/prisma.js'
import authMiddleware from '../middleware/auth.js'
import { validate, loginSchema, registerSchema } from '../middleware/validate.js'

const router = express.Router()

router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body
        const { token, user } = await authService.login(email, password)
        res.json({ success: true, token, user })
    } catch (error) {
        res.status(401).json({ success: false, error: error.message })
    }
})

router.post('/register', validate(registerSchema), async (req, res) => {
    try {
        const { token, user } = await authService.register(req.body)
        res.json({ success: true, token, user })
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
        const { name } = req.body
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { name }
        })
        res.json(user)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

export default router

