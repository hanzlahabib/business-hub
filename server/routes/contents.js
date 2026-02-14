import express from 'express'
import contentService from '../services/contentService.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
    try {
        const content = await contentService.getAll(req.user.id)
        res.json(content)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const content = await contentService.getById(req.params.id, req.user.id)
        res.json(content)
    } catch (error) {
        const status = error.message === 'Content not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

router.post('/', async (req, res) => {
    try {
        const content = await contentService.create(req.user.id, req.body)
        res.status(201).json(content)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.patch('/:id', async (req, res) => {
    try {
        const content = await contentService.update(req.params.id, req.user.id, req.body)
        res.json(content)
    } catch (error) {
        const status = error.message === 'Content not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        await contentService.delete(req.params.id, req.user.id)
        res.status(204).send()
    } catch (error) {
        const status = error.message === 'Content not found' ? 404 : 400
        res.status(status).json({ error: error.message })
    }
})

export default router
