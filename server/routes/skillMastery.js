import { Router } from 'express'
import authMiddleware from '../middleware/auth.js'
import skillMasteryRepository from '../repositories/skillMasteryRepository.js'

const router = Router()

router.use(authMiddleware)

// GET /api/skillmastery - Get skill mastery data for current user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id
        const record = await skillMasteryRepository.findByUserId(userId)
        if (record) {
            // Return the data blob directly (matches JSON Server format)
            res.json(record.data)
        } else {
            res.json({ paths: [] })
        }
    } catch (error) {
        console.error('Error fetching skill mastery:', error)
        res.status(500).json({ error: 'Failed to fetch skill mastery data' })
    }
})

// PUT /api/skillmastery - Update skill mastery data for current user
router.put('/', async (req, res) => {
    try {
        const userId = req.user.id
        const data = req.body
        const record = await skillMasteryRepository.upsert(userId, data)
        res.json(record.data)
    } catch (error) {
        console.error('Error saving skill mastery:', error)
        res.status(500).json({ error: 'Failed to save skill mastery data' })
    }
})

export default router
